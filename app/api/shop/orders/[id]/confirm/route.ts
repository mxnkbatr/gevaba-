import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/app/lib/mongodb";
import { auth } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export async function POST(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const { userId, role } = await auth();
    if (!userId && role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const orders = await getCollection("shop_orders");
    const orderObjectId = new ObjectId(id);
    const order = await orders.findOne({ _id: orderObjectId });
    if (!order) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isAdmin = role === "admin";
    const isOwner = userId && order.userId === userId;
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Move order to processing + mark paid
    await orders.updateOne(
      { _id: orderObjectId },
      {
        $set: {
          status: "processing",
          paymentStatus: "paid",
          updatedAt: new Date(),
        },
      },
    );

    // Deduct stock per item (skip unlimited stock === -1)
    const products = await getCollection("shop_products");
    for (const it of order.items ?? []) {
      const qty = Math.max(1, Number(it?.quantity ?? 1));
      const pid = it?.productId;
      if (!pid) continue;
      try {
        await products.updateOne(
          { _id: new ObjectId(pid), stock: { $ne: -1 } },
          { $inc: { stock: -qty } },
        );
      } catch (e) {
        console.error("[Shop Order Confirm] Stock update failed:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[Shop Order Confirm] Error:", e);
    return NextResponse.json({ message: "Error confirming order" }, { status: 500 });
  }
}

