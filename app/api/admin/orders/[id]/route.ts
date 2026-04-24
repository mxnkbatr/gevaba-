import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-utils";
import { ObjectId } from "mongodb";

export const dynamic = "force-dynamic";

interface Params {
  id: string;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  const { db, errorResponse } = await adminGuard(request);
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  const body = await request.json();

  const allowed = new Set([
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ]);
  const status = String(body?.status ?? "");
  if (!allowed.has(status)) {
    return NextResponse.json({ message: "Invalid status" }, { status: 400 });
  }

  await db.collection("orders").updateOne(
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

