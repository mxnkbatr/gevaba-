import React, { cache } from "react";
import { connectToDatabase } from "@/database/db";
import { Monk } from "@/database/types";
import MonkShowcaseClient from "../../components/MonkShowcaseClient";

export const revalidate = 60;

// --- DATA FETCHING (SERVER SIDE + CACHED) ---
const getMonks = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    const monks = await db.collection("users").find({ role: "monk" }).toArray() as unknown as Monk[];

    // Serialize for safely passing to Client Component
    const serialized = monks.map(monk => ({
      ...monk,
      _id: monk._id?.toString() ?? ""
    }));

    // Sort: Special monks first
    return serialized.sort((a, b) => {
      if (a.isSpecial && !b.isSpecial) return -1;
      if (!a.isSpecial && b.isSpecial) return 1;
      return 0;
    });
  } catch (error) {
    console.error("Failed to fetch monks server-side:", error);
    return [];
  }
});

export default async function DivineTarotShowcase() {
  const monks = await getMonks();

  return (
    <MonkShowcaseClient initialMonks={monks} />
  );
}