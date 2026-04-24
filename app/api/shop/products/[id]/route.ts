import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";
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

    const products = await getCollection("shop_products");
    const product = await products.findOne({
      _id: new ObjectId(id),
      isActive: true,
    });

    if (!product) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...product,
      _id: product._id?.toString?.() ?? id,
    });
  } catch (e: any) {
    console.error("[Shop Product] Error:", e);
    return NextResponse.json({ message: "Error fetching product" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const { role } = await auth();
    if (role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const body = await req.json();
    const update: any = { updatedAt: new Date() };

    if (body?.name) update.name = body.name;
    if (body?.description) update.description = body.description;
    if (body?.price !== undefined) update.price = Number(body.price ?? 0);
    if (body?.category !== undefined) update.category = String(body.category);
    if (body?.type !== undefined) update.type = String(body.type);
    if (body?.stock !== undefined) update.stock = Number(body.stock ?? 0);
    if (body?.isFeatured !== undefined) update.isFeatured = Boolean(body.isFeatured);
    if (body?.isActive !== undefined) update.isActive = Boolean(body.isActive);
    if (body?.tags !== undefined) update.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body?.images !== undefined) update.images = Array.isArray(body.images) ? body.images : [];

    const products = await getCollection("shop_products");
    await products.updateOne({ _id: new ObjectId(id) }, { $set: update });

    const updated = await products.findOne({ _id: new ObjectId(id) });
    if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });

    return NextResponse.json({
      ...updated,
      _id: updated._id?.toString?.() ?? id,
    });
  } catch (e: any) {
    console.error("[Shop Product PUT] Error:", e);
    return NextResponse.json({ message: "Error updating product" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<Params> },
) {
  try {
    const { role } = await auth();
    if (role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;
    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    const products = await getCollection("shop_products");
    await products.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isActive: false, updatedAt: new Date() } },
    );

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("[Shop Product DELETE] Error:", e);
    return NextResponse.json({ message: "Error deleting product" }, { status: 500 });
  }
}

