import React, { cache } from "react";
import { connectToDatabase } from "@/database/db";
import ShopClient from "./ShopClient";

export const revalidate = 60;

const getProducts = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    const products = await db
      .collection("shop_products")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .project({
        name: 1,
        description: 1,
        price: 1,
        images: 1,
        category: 1,
        stock: 1,
        isActive: 1,
        isFeatured: 1,
        type: 1,
        tags: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .toArray();

    return products.map((p: any) => ({ ...p, _id: p._id?.toString?.() ?? "" }));
  } catch (e) {
    console.error("Failed to fetch products server-side:", e);
    return [];
  }
});

export default async function ShopPage() {
  const products = await getProducts();
  return <ShopClient products={products} />;
}

