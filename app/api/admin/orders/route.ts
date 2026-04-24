import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { db, errorResponse } = await adminGuard(request);
  if (errorResponse) return errorResponse;

  const orders = await db
    .collection("orders")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(orders);
}

