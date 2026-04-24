import { NextRequest, NextResponse } from "next/server";
import { getCollection } from "@/app/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const category = (req.nextUrl.searchParams.get("category") || "").trim();
    const featuredRaw = (req.nextUrl.searchParams.get("featured") || "").trim().toLowerCase();
    const featured = featuredRaw === "true" ? true : featuredRaw === "false" ? false : null;

    const query: Record<string, unknown> = { isActive: true };
    if (category) query.category = category;
    if (featured !== null) query.isFeatured = featured;

    const collection = await getCollection("shop_products");

    const products = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .project({
        name: 1,
        description: 1,
        price: 1,
        images: 1,
        category: 1,
        stock: 1,
        isFeatured: 1,
        type: 1,
        isActive: 1,
      })
      .toArray();

    const serialized = products.map((p: any) => ({
      ...p,
      _id: p._id?.toString?.() ?? p._id,
    }));

    return NextResponse.json(serialized, {
      headers: {
        "Cache-Control": "public, s-maxage=60",
      },
    });
  } catch (e: any) {
    console.error("[Shop Products] Error:", e);
    return NextResponse.json({ message: "Error fetching products" }, { status: 500 });
  }
}

