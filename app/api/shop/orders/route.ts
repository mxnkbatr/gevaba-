import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/database/db";
import { auth } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

type CartItem = {
  productId: string;
  quantity: number;
};

export async function GET(_req: NextRequest) {
  try {
    const { userId, role } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const orders = db.collection("shop_orders");
    const query = role === "admin" ? {} : { userId };
    const list = await orders.find(query).sort({ createdAt: -1 }).toArray();

    const serialized = list.map((o: any) => ({
      ...o,
      _id: o._id?.toString?.() ?? o._id,
    }));

    return NextResponse.json(serialized);
  } catch (e: any) {
    console.error("[Shop Orders GET] Error:", e);
    return NextResponse.json({ message: "Error fetching orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const items = (body?.items ?? []) as CartItem[];
    const deliveryInfo = body?.deliveryInfo ?? null;
    const userEmail = typeof body?.userEmail === "string" ? body.userEmail.trim() : "";

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Missing items" }, { status: 400 });
    }
    if (!userEmail) {
      return NextResponse.json({ message: "Missing userEmail" }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const productsCollection = db.collection("shop_products");

    const productIds = items
      .map((i) => i.productId)
      .filter(Boolean)
      .map((id) => {
        try {
          return new ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean) as ObjectId[];

    if (productIds.length !== items.length) {
      return NextResponse.json({ message: "Invalid productId" }, { status: 400 });
    }

    const products = await productsCollection
      .find({ _id: { $in: productIds }, isActive: true })
      .project({
        name: 1,
        price: 1,
        images: 1,
        stock: 1,
        isActive: 1,
        type: 1,
      })
      .toArray();

    const byId = new Map(products.map((p: any) => [p._id.toString(), p]));
    const orderItems = items.map((i) => {
      const p = byId.get(i.productId);
      return {
        productId: i.productId,
        name: p?.name ?? { mn: "Бараа", en: "Product" },
        price: Number(p?.price ?? 0),
        quantity: Math.max(1, Number(i.quantity ?? 1)),
        image: Array.isArray(p?.images) ? p.images[0] : undefined,
      };
    });

    if (orderItems.some((i) => !i.price || !i.productId)) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    // Validate deliveryInfo when there is any physical item
    const hasPhysical = products.some((p: any) => (p?.type ?? "physical") === "physical");
    if (hasPhysical) {
      const ok =
        deliveryInfo &&
        typeof deliveryInfo?.name === "string" &&
        typeof deliveryInfo?.phone === "string" &&
        typeof deliveryInfo?.address === "string" &&
        typeof deliveryInfo?.district === "string" &&
        deliveryInfo.name.trim() &&
        deliveryInfo.phone.trim() &&
        deliveryInfo.address.trim() &&
        deliveryInfo.district.trim();
      if (!ok) {
        return NextResponse.json(
          { message: "Missing deliveryInfo for physical items" },
          { status: 400 },
        );
      }
    }

    // Best-effort stock check (final deduction happens on payment confirm)
    for (const it of orderItems) {
      const p = byId.get(it.productId);
      // stock: -1 = unlimited
      if (typeof p?.stock === "number" && p.stock !== -1 && p.stock < it.quantity) {
        return NextResponse.json(
          { message: "Insufficient stock", productId: it.productId },
          { status: 409 },
        );
      }
    }

    const totalAmount = orderItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    const now = new Date();

    // If server-side auth is not present (e.g. Clerk-only session), fall back to guest orders.
    const resolvedUserId = userId ?? "guest";

    const ordersCollection = db.collection("shop_orders");
    const insert = await ordersCollection.insertOne({
      userId: resolvedUserId,
      userEmail,
      items: orderItems,
      status: "pending",
      paymentStatus: "pending",
      totalAmount,
      deliveryInfo,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      orderId: insert.insertedId.toString(),
      totalAmount,
    });
  } catch (e: any) {
    console.error("[Shop Orders] Error:", e);
    return NextResponse.json({ message: "Error creating order" }, { status: 500 });
  }
}

