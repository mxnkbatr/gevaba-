"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";

const BookingPageClient = dynamic(() => import("./BookingPageClient"), { ssr: false });
const BookingDetailClient = dynamic(() => import("./BookingDetailClient"), { ssr: false });

export default function BookingPageGate() {
  const params = useParams();
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const id = (params?.id as string) || searchParams?.get('id');

  // MongoDB ObjectId is 24 hex characters.
  // We use this to distinguish between a new booking (id = serviceId or 'initial')
  // and viewing an existing booking detail.
  const isExistingBooking = id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id);

  if (isExistingBooking) {
    return <BookingDetailClient />;
  }

  return <BookingPageClient />;
}
