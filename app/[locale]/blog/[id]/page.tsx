import React from "react";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import DivineBackground from "@/app/components/DivineBackground";
import BlogDetailClient from "@/app/components/BlogDetailClient";

export const revalidate = 60;

export function generateStaticParams() {
  return [
    { locale: 'en', id: 'initial' },
    { locale: 'mn', id: 'initial' },
  ];
}

function SkeletonLoader() {
    return (
        <div className="min-h-[100svh] bg-cream px-5 pt-[calc(env(safe-area-inset-top,44px)+16px)] animate-pulse">
            <div className="w-full h-64 bg-stone/20 rounded-3xl mb-6"></div>
            <div className="w-3/4 h-10 bg-stone/20 rounded-xl mb-4"></div>
            <div className="w-1/2 h-6 bg-stone/20 rounded-xl mb-8"></div>
            <div className="space-y-4">
                <div className="w-full h-4 bg-stone/20 rounded"></div>
                <div className="w-full h-4 bg-stone/20 rounded"></div>
                <div className="w-5/6 h-4 bg-stone/20 rounded"></div>
            </div>
        </div>
    );
}

async function getBlogPost(id: string) {
    if (id === 'initial') return null;
    try {
        const { db } = await connectToDatabase();
        let post = await db.collection("blogs").findOne({ id: id });
        if (post) return post;
        if (ObjectId.isValid(id)) {
            return await db.collection("blogs").findOne({ _id: new ObjectId(id) });
        }
        return null;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export default async function BlogDetailPage(props: { params: Promise<{ id: string, locale: string }> }) {
    const params = await props.params;
    
    if (params.id === 'initial') {
        return <SkeletonLoader />;
    }

    const { id, locale: lang } = params;
    const post = await getBlogPost(id);

    if (!post) {
        return (
            <div className="min-h-[100svh] bg-cream flex flex-col items-center justify-center p-6 text-center">
                <DivineBackground />
                <div className="w-20 h-20 rounded-2xl bg-white/70 border border-gold/20 shadow-gold flex items-center justify-center mb-6 relative z-10">
                    <BookOpen className="text-earth" size={40} />
                </div>
                <h1 className="text-4xl font-serif font-black text-ink mb-4 relative z-10">404</h1>
                <p className="text-earth mb-8 relative z-10 italic">Нийтлэл олдсонгүй.</p>
                <Link href={`/${lang}/blog`} className="cta-button inline-flex min-h-12 px-8 shadow-gold gap-2 relative z-10">
                    <ArrowLeft size={18} /> Буцах
                </Link>
            </div>
        );
    }

    // Serialize MongoDB objects for Client Component
    const serializedPost = {
        ...post,
        _id: post._id.toString(),
        authorId: post.authorId ? post.authorId.toString() : ""
    };

    return (
        <BlogDetailClient post={serializedPost} lang={lang} />
    );
}