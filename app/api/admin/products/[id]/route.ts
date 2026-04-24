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

  const update: any = { updatedAt: new Date() };
  if (body?.name) update.name = body.name;
  if (body?.description) update.description = body.description;
  if (body?.images) update.images = Array.isArray(body.images) ? body.images : [];
  if (body?.price !== undefined) update.price = Number(body.price ?? 0);
  if (body?.isActive !== undefined) update.isActive = Boolean(body.isActive);
  if (body?.category !== undefined) update.category = String(body.category);
  if (body?.stock !== undefined) update.stock = Number(body.stock ?? 0);
  if (body?.isFeatured !== undefined) update.isFeatured = Boolean(body.isFeatured);
  if (body?.type !== undefined) update.type = String(body.type);
  if (body?.tags !== undefined) update.tags = Array.isArray(body.tags) ? body.tags : [];

  await db.collection("products").updateOne({ _id: new ObjectId(id) }, { $set: update });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> },
) {
  const { db, errorResponse } = await adminGuard(request);
  if (errorResponse) return errorResponse;

  const { id } = await context.params;
  await db.collection("products").deleteOne({ _id: new ObjectId(id) });
  return NextResponse.json({ success: true });
}

