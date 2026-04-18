/**
 * Shown immediately on client navigations under /[locale] while the next page RSC loads.
 * Cuts the "frozen >1s" feeling when server/data work is still in flight.
 */
export default function LocaleSegmentLoading() {
  return (
    <div className="w-full bg-cream px-5 pt-3 pb-[calc(env(safe-area-inset-bottom,0px)+96px)]">
      <div className="mx-auto max-w-lg space-y-4 pt-2">
        <div className="h-9 w-2/5 max-w-[200px] rounded-xl bg-black/[0.06] animate-pulse" />
        <div className="h-44 w-full rounded-[28px] bg-black/[0.06] animate-pulse" />
        <div className="h-24 w-full rounded-2xl bg-black/[0.05] animate-pulse" />
        <div className="h-32 w-full rounded-2xl bg-black/[0.05] animate-pulse" />
      </div>
    </div>
  );
}
