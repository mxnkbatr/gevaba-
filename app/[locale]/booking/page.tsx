import { redirect } from "next/navigation";

export default async function BookingIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const validLocale = ["mn", "en"].includes(locale) ? locale : "mn";

  redirect(`/${validLocale}/monks`);
}
