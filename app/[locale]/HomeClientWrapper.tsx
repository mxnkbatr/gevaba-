"use client";

import React, { useState, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/app/capacitor/hooks/usePlatform";
import HomePage from "../components/HomePage";
import MobileScrollView from "../components/mobile/MobileScrollView";
import { SkeletonMonkList, SkeletonBlogList } from "../components/SkeletonCard";
import { Monk } from "@/database/types";

const PhilosophySection = dynamic(() => import("../components/Philosophy"));
const NirvanaComments = dynamic(() => import("../components/NirvanaComments"));

interface HomeBlog {
  _id: string;
  id: string;
  title: { mn: string; en: string };
  date: string;
  cover: string;
  category: string;
  authorName: string;
}

interface HomeClientWrapperProps {
  monks: unknown[];
  blogs: HomeBlog[];
  featuredProducts?: unknown[];
  locale: "mn" | "en";
}

/**
 * Client wrapper for the home page.
 *
 * The parent server component fetches data and passes it as props.
 * This wrapper provides:
 * - MobileScrollView with pull-to-refresh
 * - On refresh: calls router.refresh() to trigger Next.js server revalidation,
 *   which re-runs the server component and streams fresh data down
 * - Skeleton overlay during refresh
 */
export default function HomeClientWrapper({
  monks,
  blogs,
  featuredProducts,
  locale,
}: HomeClientWrapperProps): React.JSX.Element {
  const { isNative } = usePlatform();
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const refetch = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      // router.refresh() re-runs the server component, re-fetches from DB,
      // and streams the result back without a full page reload
      router.refresh();
    } catch (err: unknown) {
      console.error("Home refresh failed:", err);
    } finally {
      // Small delay so the user sees the spinner before the new data arrives
      setTimeout((): void => setIsRefreshing(false), 800);
    }
  }, [router]);

  const featuredMonks: unknown[] = monks.slice(0, 3);

  return (
    <MobileScrollView pullToRefresh={isNative} onRefresh={refetch}>
      {isRefreshing ? (
        <div className="min-h-svh bg-white">
          {/* Hero skeleton */}
          <div className="h-85 bg-amber-50/60 animate-pulse" />

          {/* Featured monks skeleton */}
          <section className="pt-8 pb-4">
            <div className="px-5 mb-4">
              <div className="h-6 w-40 rounded-lg bg-amber-50/60 animate-pulse mb-2" />
              <div className="h-4 w-56 rounded-lg bg-amber-50/60 animate-pulse" />
            </div>
            <div className="px-5">
              <div className="h-96 bg-amber-50/60 rounded-3xl animate-pulse" />
            </div>
          </section>

          {/* Blog skeleton */}
          <section className="px-5 pt-6">
            <div className="mb-4">
              <div className="h-6 w-32 rounded-lg bg-amber-50/60 animate-pulse mb-2" />
              <div className="h-4 w-48 rounded-lg bg-amber-50/60 animate-pulse" />
            </div>
            <SkeletonBlogList count={3} />
          </section>

          {/* Monks skeleton */}
          <section className="px-5 pt-6 pb-10">
            <div className="mb-4">
              <div className="h-6 w-40 rounded-lg bg-amber-50/60 animate-pulse mb-2" />
              <div className="h-4 w-52 rounded-lg bg-amber-50/60 animate-pulse" />
            </div>
            <SkeletonMonkList count={4} />
          </section>
        </div>
      ) : (
        <>
          <HomePage
            locale={locale}
            blogs={blogs}
            monks={monks as Monk[]}
            featuredMonks={featuredMonks as Monk[]}
            featuredProducts={(featuredProducts ?? []) as any[]}
          />
          <Suspense
            fallback={<div className="h-48 skeleton mx-5 my-6 rounded-2xl" />}
          >
            <PhilosophySection />
          </Suspense>
          <Suspense
            fallback={<div className="h-48 skeleton mx-5 my-6 rounded-2xl" />}
          >
            <NirvanaComments />
          </Suspense>
        </>
      )}
    </MobileScrollView>
  );
}
