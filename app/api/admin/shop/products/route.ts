import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/app/lib/mongodb";
import { auth } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const { role } = await auth();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const products = await getCollection("shop_products");
  const list = await products.find({}).sort({ createdAt: -1 }).toArray();

  const serialized = list.map((p: any) => ({ ...p, _id: p._id?.toString?.() ?? p._id }));
  return NextResponse.json(serialized);
}

export async function POST(req: NextRequest) {
  const { role } = await auth();
  if (role !== "admin") return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const nameMn = body?.name?.mn;
  const nameEn = body?.name?.en;
  const price = Number(body?.price ?? NaN);
  const category = body?.category;
  const type = body?.type;
  const stock = Number(body?.stock ?? NaN);

  if (!nameMn || !nameEn || !Number.isFinite(price) || !category || !type || !Number.isFinite(stock)) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 },
    );
  }

  const now = new Date();
  const products = await getCollection("shop_products");
  const res = await products.insertOne({
    name: { mn: nameMn, en: nameEn },
    description: body?.description ?? { mn: "", en: "" },
    price,
    images: Array.isArray(body?.images) ? body.images : [],
    category,
    type,
    stock,
    isActive: true,
    isFeatured: Boolean(body?.isFeatured ?? false),
    tags: Array.isArray(body?.tags) ? body.tags : [],
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ success: true, id: res.insertedId.toString() });
}

