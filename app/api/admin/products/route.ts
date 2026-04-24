import { NextRequest, NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { db, errorResponse } = await adminGuard(request);
  if (errorResponse) return errorResponse;

  const products = await db
    .collection("products")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  return NextResponse.json(products);
}

export async function POST(request: NextRequest) {
  const { db, errorResponse } = await adminGuard(request);
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const now = new Date();

  const doc = {
    name: body?.name ?? { mn: "Шинэ бараа", en: "New product" },
    description: body?.description ?? { mn: "", en: "" },
    price: Number(body?.price ?? 0),
    images: Array.isArray(body?.images) ? body.images : [],
    category: body?.category ?? "other",
    stock:
      typeof body?.stock === "number"
        ? body.stock
        : Number(body?.stock ?? 0),
    isActive: body?.isActive ?? true,
    isFeatured: body?.isFeatured ?? false,
    type: body?.type ?? "physical",
    tags: Array.isArray(body?.tags) ? body.tags : [],
    createdAt: now,
    updatedAt: now,
  };

  const res = await db.collection("products").insertOne(doc);
  return NextResponse.json({ success: true, id: res.insertedId.toString() });
}

