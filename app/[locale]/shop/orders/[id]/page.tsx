// Server component — exports generateStaticParams for static export (Capacitor/Appflow).
// The actual client-side rendering is done in _OrderDetailClient.tsx.
export function generateStaticParams() {
  return [
    { locale: "mn", id: "capacitor" },
    { locale: "en", id: "capacitor" },
  ];
}

export { default } from "./_OrderDetailClient";
