import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/app/lib/mongodb";
import { auth } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const { userId, role } = await auth();
    if (!userId && role !== "admin") {
      // allow guests only if they "own" the order (guest userId), but we still need a userId to compare
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const orders = await getCollection("shop_orders");
    const order = await orders.findOne({ _id: new ObjectId(id) });
    if (!order) return NextResponse.json({ message: "Not found" }, { status: 404 });

    const isAdmin = role === "admin";
    const isOwner = userId && order.userId === userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      ...order,
      _id: order._id?.toString?.() ?? id,
    });
  } catch (e: any) {
    console.error("[Shop Order GET] Error:", e);
    return NextResponse.json({ message: "Error fetching order" }, { status: 500 });
  }
}

