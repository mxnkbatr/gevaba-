import BookingPageGate from "./BookingPageGate";

/** Placeholder paths for static export (Capacitor); real flows use `?monkId=`. */
export function generateStaticParams() {
  return [
    { locale: "en", id: "initial" },
    { locale: "mn", id: "initial" },
  ];
}

export default function BookingPage() {
  return <BookingPageGate />;
}
