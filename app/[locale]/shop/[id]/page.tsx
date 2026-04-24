import React, { cache } from "react";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import ProductDetailClient from "./ProductDetailClient";

export const revalidate = 60;

const getProduct = cache(async (id: string): Promise<any | null> => {
  try {
    const { db } = await connectToDatabase();
    const p = await db.collection("shop_products").findOne({
      _id: new ObjectId(id),
      isActive: true,
    });
    if (!p) return null;
    return { ...p, _id: p._id?.toString?.() ?? id };
  } catch (e) {
    console.error("Failed to fetch product server-side:", e);
    return null;
  }
});

export default async function ProductPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const product = await getProduct(id);
  return <ProductDetailClient product={product as any} />;
}

