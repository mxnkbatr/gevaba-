import React, { cache } from "react";
import { connectToDatabase } from "@/database/db";
import { Monk } from "@/database/types";
import MonkShowcaseClient from "../../components/MonkShowcaseClient";

export const revalidate = 60;

// --- DATA FETCHING (SERVER SIDE + CACHED) ---
const getMonks = cache(async () => {
  try {
    const { db } = await connectToDatabase();
    // List view only: same filter + projection as /api/monks (avoid huge bios/schedules on RSC)
    const monks = (await db
      .collection("users")
      .find(
        {
          role: "monk",
          $or: [
            { "name.en": { $exists: true, $ne: "" } },
            { "name.mn": { $exists: true, $ne: "" } },
          ],
        },
        {
          projection: {
            name: 1,
            title: 1,
            image: 1,
            imageUrl: 1,
            avatar: 1,
            isAvailable: 1,
            isSpecial: 1,
            specialties: 1,
            monkNumber: 1,
            yearsOfExperience: 1,
          },
        },
      )
      .toArray()) as unknown as Monk[];

    const serialized = monks.map((monk) => ({
      ...monk,
      _id: monk._id?.toString() ?? "",
    }));

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