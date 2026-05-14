// Server component — required for output: export (Capacitor/Appflow static build).
// Renders the client component which handles data fetching via useEffect.
import OrderDetailClient from "./_OrderDetailClient";

export function generateStaticParams() {
  return [
    { locale: "mn", id: "capacitor" },
    { locale: "en", id: "capacitor" },
  ];
}

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
