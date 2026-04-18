export const MONTHS_EN_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Same output on server (Node) and browser — avoids Intl / toLocaleDateString hydration mismatches */
export function formatBlogPostDate(
  date: string | Date,
  lang: "mn" | "en" | string,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();

  if (lang === "mn") {
    return `${y} оны ${month}-р сарын ${day}`;
  }

  return `${MONTHS_EN_SHORT[month - 1]} ${day}, ${y}`;
}

export const formatDate = (date: string | Date, lang: string = "mn") => {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const day = d.getDate();
  const month = d.getMonth();

  if (lang === "mn") {
    // Manual Mongolian format: "3-р сарын 28"
    return `${month + 1}-р сарын ${day}`;
  }

  // Default to English format "Mar 28"
  return `${MONTHS_EN_SHORT[month]} ${day}`;
};

const WEEKDAY_MN = [
  "Ням",
  "Даваа",
  "Мягмар",
  "Лхагва",
  "Пүрэв",
  "Баасан",
  "Бямба",
] as const;
const WEEKDAY_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** SSR-safe weekday label (avoid toLocaleDateString weekday) */
export function formatWeekdayShort(d: Date, lang: string): string {
  const i = d.getDay();
  return lang === "mn" ? WEEKDAY_MN[i] : WEEKDAY_EN[i];
}

/** 24h HH:mm — avoids toLocaleTimeString hydration differences */
export function formatTimeShort(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (isNaN(d.getTime())) return "";
  const h = d.getHours();
  const m = d.getMinutes();
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
