import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/app/lib/mongodb";
import { auth } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const { role } = await auth();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const orders = await getCollection("shop_orders");
  const list = await orders.find({}).sort({ createdAt: -1 }).toArray();
  const serialized = list.map((o: any) => ({ ...o, _id: o._id?.toString?.() ?? o._id }));
  return NextResponse.json(serialized);
}

