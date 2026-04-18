import React, { cache } from "react";
import { connectToDatabase } from "@/database/db";
import BlogListClient from "../../components/BlogListClient";

export const revalidate = 60;

// --- DATA FETCHING (SERVER SIDE + CACHED) ---
const getBlogs = cache(async () => {
    try {
        const { db } = await connectToDatabase();
        const blogs = await db.collection("blogs")
            .find({})
            .sort({ date: -1 })
            .toArray();

        // Serialize for client use
        return (blogs as any[]).map(blog => ({
            _id: blog._id.toString(),
            id: blog.id || blog._id.toString(),
            title: blog.title || { mn: "", en: "" },
            content: blog.content || { mn: "", en: "" },
            date: blog.date ? new Date(blog.date).toISOString() : new Date().toISOString(),
            cover: blog.cover || "",
            category: blog.category || "wisdom",
            authorName: blog.authorName || "Багш",
            authorId: blog.authorId ? blog.authorId.toString() : ""
        }));
    } catch (error) {
        console.error("Failed to fetch blogs server-side:", error);
        return [];
    }
});

export default async function BlogPage() {
    const posts = await getBlogs();

    return (
        <BlogListClient initialPosts={posts} />
    );
}
