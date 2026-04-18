import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/database/db";
import ContentManager from "@/app/components/ContentManager";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function MonkContentPage() {
    const user = await currentUser();
    if (!user) redirect("/sign-in");

    const { db } = await connectToDatabase();
    const dbUser = await db.collection("users").findOne({ clerkId: user.id });

    if (!dbUser) redirect("/sign-in");

    const isSpecialMonk = dbUser.role === 'monk' && dbUser.isSpecial === true;
    const isAdmin = dbUser.role === 'admin';

    if (!isSpecialMonk && !isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream">
                <div className="text-center">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-stone-800">Access Denied</h1>
                    <p className="text-stone-500 mt-2">Only Special Monks can access this content manager.</p>
                    <Link href="/profile" className="inline-block mt-6 text-blue-600 hover:underline">Return to Profile</Link>
                </div>
            </div>
        );
    }

    // Fetch ONLY blogs (filtered by author for monks, or all for admin if desired)

    const query = isAdmin ? {} : { authorId: dbUser._id };

    const blogs = await db.collection("blogs").find(query).toArray();

    const serialize = (items: any[]) => items.map(i => ({
        ...i,
        _id: i._id.toString(),
        id: i.id || i._id.toString(),
        authorId: i.authorId?.toString() || ""
    }));

    return (
        <div className="min-h-screen bg-cream font-sans text-ink">
            <main className="container mx-auto px-4 pt-32 pb-20">
                <header className="mb-10">
                    <h1 className="text-3xl font-semibold font-serif text-ink tracking-tight">Monk's Blog Manager</h1>
                    <p className="text-stone-500">Share your wisdom and daily thoughts with the community.</p>
                </header>

                <ContentManager blogs={serialize(blogs)} />
            </main>
        </div>
    );

}
