"use client";

import dynamic from "next/dynamic";

const BookingPageClient = dynamic(() => import("./BookingPageClient"), {
  ssr: false,
});

export default function BookingPageGate() {
  return <BookingPageClient />;
}
