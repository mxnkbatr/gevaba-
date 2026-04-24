import { cache } from "react";
import HomePage from "../components/HomePage";
import { connectToDatabase } from "@/database/db";
import { Monk } from "@/database/types";

/** ISR: CDN / edge cache — Mongo-г секунд бүр биш ~60s тутамд шинэчилнэ (CAPACITOR_BUILD export үед үл хэрэгжинэ). */
export const revalidate = 60;

const getMonks = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    const monks = (await db
      .collection("users")
      .find(
        { role: "monk", isAvailable: { $ne: false } },
        {
          projection: {
            _id: 1,
            name: 1,
            title: 1,
            image: 1,
            isAvailable: 1,
            isSpecial: 1,
            monkNumber: 1,
          },
        },
      )
      .toArray()) as unknown as Monk[];
    return monks
      .map((m) => ({ ...m, _id: m._id?.toString() ?? "" }))
      .sort((a, b) => {
        if (a.isSpecial && !b.isSpecial) return -1;
        if (!a.isSpecial && b.isSpecial) return 1;
        if (a.monkNumber !== undefined && b.monkNumber !== undefined)
          return a.monkNumber - b.monkNumber;
        return 0;
      });
  } catch {
    return [];
  }
});

const getBlogs = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    const blogs = await db
      .collection("blogs")
      .find({})
      .sort({ date: -1 })
      .limit(5)
      .project({
        _id: 1,
        id: 1,
        title: 1,
        date: 1,
        cover: 1,
        category: 1,
        authorName: 1,
      })
      .toArray();
    return blogs.map((blog) => ({
      _id: blog._id.toString(),
      id: blog.id || blog._id.toString(),
      title: blog.title || { mn: "", en: "" },
      date: blog.date
        ? new Date(blog.date).toISOString()
        : new Date().toISOString(),
      cover: blog.cover || "",
      category: blog.category || "Wisdom",
      authorName: blog.authorName || "Багш",
    }));
  } catch {
    return [];
  }
});

const getShopFeatured = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    const products = await db
      .collection("shop_products")
      .find({ isFeatured: true, isActive: true })
      .sort({ updatedAt: -1 })
      .limit(4)
      .project({
        _id: 1,
        name: 1,
        price: 1,
        images: 1,
      })
      .toArray();

    return products.map((p: any) => ({
      ...p,
      _id: p._id?.toString?.() ?? "",
    }));
  } catch {
    return [];
  }
});

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Parallel Fetch (O(1) sequential wait)
  const [allMonks, blogs, featuredProducts] = await Promise.all([
    getMonks(),
    getBlogs(),
    getShopFeatured(),
  ]);

  const featuredMonks = allMonks.slice(0, 3);

  return (
    <HomePage
      locale={locale}
      blogs={blogs}
      monks={allMonks}
      featuredMonks={featuredMonks}
      featuredProducts={featuredProducts}
    />
  );
}
