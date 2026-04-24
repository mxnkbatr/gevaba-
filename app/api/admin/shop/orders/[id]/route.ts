import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/app/lib/mongodb";
import { auth } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<Params> },
) {
  const { role } = await auth();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const body = await req.json();
  const status = String(body?.status ?? "");

  const allowed = new Set([
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]);
  if (!allowed.has(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  const orders = await getCollection("shop_orders");
  await orders.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        status,
        ...(status === "paid" ? { paymentStatus: "paid" } : {}),
        updatedAt: new Date(),
      },
    },
  );

  return NextResponse.json({ success: true });
}

