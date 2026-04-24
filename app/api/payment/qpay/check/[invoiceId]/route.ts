import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/app/lib/mongodb";
import { checkPayment } from "@/lib/qpay";
import { deductInventory } from "@/app/lib/inventory";

interface QPayCheckParams {
  invoiceId: string;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<QPayCheckParams> },
) {
  try {
    const params = await context.params;
    const { invoiceId } = params;

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    // 1. Check QPay Status
    const paymentStatus = await checkPayment(invoiceId);

    if (paymentStatus.paid) {
      // 2. Update Order/Booking Status
      const ordersCollection = await getCollection("orders");
      let order = await ordersCollection.findOne({ qpayInvoiceId: invoiceId });
      let collectionType = "orders";

      if (!order) {
        const shopOrdersCollection = await getCollection("shop_orders");
        order = await shopOrdersCollection.findOne({ qpayInvoiceId: invoiceId });
        collectionType = "shop_orders";
      }

      if (!order) {
        const bookingsCollection = await getCollection("bookings");
        order = await bookingsCollection.findOne({ qpayInvoiceId: invoiceId });
        collectionType = "bookings";
      }

      if (order && order.status === "pending") {
        const collection = await getCollection(collectionType);
        await collection.updateOne(
          { _id: order._id },
          {
            $set: {
              // Shop orders: match ShopOrder schema. Bookings keep their own status semantics.
              ...(collectionType === "orders" || collectionType === "shop_orders"
                ? { status: "paid", paymentStatus: "paid" }
                : { status: "confirmed" }),
              updatedAt: new Date(),
            },
          },
        );

        // Deduct inventory since order is now confirmed
        if (order.items && order.items.length > 0) {
          await deductInventory(order._id.toString(), order.items);
        }

        // Notify Admin
        try {
          const { notifyAdminNewOrder } =
            await import("@/lib/adminNotifications");
          await notifyAdminNewOrder(
            order._id.toString(),
            order.deliveryInfo?.name || "Хэрэглэгч",
            order.totalAmount || order.total || order.totalPrice || 0,
          );
        } catch (e) {
          console.error("[QPay Check] Failed to notify admin:", e);
        }

        // Notify Customer (Non-blocking)
        try {
          const notificationsCollection = await getCollection("notifications");
          await notificationsCollection.insertOne({
            userId: order.userId,
            title: "✅ Төлбөр баталгаажлаа",
            message: `Таны #${order._id.toString().slice(-6)} захиалгын төлбөр амжилттай хийгдлээ.`,
            type: "order",
            isRead: false,
            link: `/orders/${order._id}`,
            createdAt: new Date(),
          });
        } catch (e) {
          console.error("Notify error", e);
        }
      }
    }

    return NextResponse.json(paymentStatus);
  } catch (error: unknown) {
    console.error("[QPay Check API] Error:", error);
    return NextResponse.json({ error: "Status check failed" }, { status: 500 });
  }
}
