import { getCollection } from "./mongodb";
import { ObjectId } from "mongodb";

interface OrderItem {
  id?: string;
  productId?: string;
  quantity: number;
  variantId?: string;
  selectedOptions?: Record<string, string>;
  [key: string]: unknown;
}

/**
 * Deducts stock from each product (or variant) in the order.
 * Idempotent: uses an `inventoryDeducted` flag on the order document
 * so calling this more than once for the same order is a no-op.
 */
export async function deductInventory(
  orderId: string,
  items: OrderItem[],
): Promise<void> {
  if (!items || items.length === 0) return;

  let orderObjectId: ObjectId;
  try {
    orderObjectId = new ObjectId(orderId);
  } catch {
    console.error(`[Inventory] Invalid orderId: ${orderId}`);
    return;
  }

  // Support both legacy "orders" and new "shop_orders".
  // We idempotently set `inventoryDeducted` on whichever collection contains this orderId.
  let guard = await (await getCollection("shop_orders")).updateOne(
    { _id: orderObjectId, inventoryDeducted: { $ne: true } },
    { $set: { inventoryDeducted: true } },
  );
  if (guard.matchedCount === 0) {
    guard = await (await getCollection("orders")).updateOne(
      { _id: orderObjectId, inventoryDeducted: { $ne: true } },
      { $set: { inventoryDeducted: true } },
    );
  }

  if (guard.matchedCount === 0) {
    console.log(`[Inventory] Already deducted for order ${orderId}, skipping.`);
    return;
  }

  const productsCollection = await getCollection("shop_products");

  for (const item of items) {
    const productId = item.productId ?? item.id;
    if (!productId) continue;

    let productObjectId: ObjectId;
    try {
      productObjectId = new ObjectId(productId);
    } catch {
      console.warn(`[Inventory] Skipping invalid productId: ${productId}`);
      continue;
    }

    const qty = Math.max(1, item.quantity ?? 1);

    try {
      if (item.variantId) {
        // Decrement the specific variant's inventory
        await productsCollection.updateOne(
          { _id: productObjectId, "variants.id": item.variantId },
          {
            $inc: {
              "variants.$.inventory": -qty,
              salesCount: qty,
            },
          },
        );
      } else {
        // Decrement the top-level product stock (stock: -1 means unlimited)
        await productsCollection.updateOne(
          { _id: productObjectId, stock: { $ne: -1 } },
          {
            $inc: {
              stock: -qty,
            },
          },
        );
      }
    } catch (itemError) {
      // Log but continue — one bad item should not block the rest
      console.error(
        `[Inventory] Failed to deduct product ${productId} (order ${orderId}):`,
        itemError,
      );
    }
  }

  console.log(
    `[Inventory] Deducted inventory for order ${orderId} (${items.length} item(s)).`,
  );
}
