import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/database/db";
import { getAuthUser } from "@/lib/auth";
import { clerkClient } from "@clerk/nextjs/server";

/**
 * GDPR / App Store deletion endpoint.
 *
 * Deletes:
 * - user document
 * - related bookings, messages, reviews, notifications (best-effort)
 * - Clerk account (if the user authenticated via Clerk)
 *
 * Production vs dev:
 * - In production, this should be protected by auth (withAuth) and require explicit user confirmation UX.
 * - In development, it still requires auth to avoid accidental deletes.
 */
type Props = {
  params: Promise<{ id: string }>;
};

export async function DELETE(req: Request, props: Props) {
  const authUser = await getAuthUser(req);
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const params = await props.params;
  const id = params.id; // MongoDB _id string (preferred) or Clerk ID

  if (!id) {
    return NextResponse.json({ message: "Missing user id" }, { status: 400 });
  }

  // Only allow self-delete (or admin).
  // Accept either dbId or Clerk ID for self-delete routing convenience.
  if (authUser.role !== "admin" && id !== authUser.dbId && id !== authUser.id) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  if (!ObjectId.isValid(authUser.dbId)) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
  }

  const { db } = await connectToDatabase();
  const userObjectId = new ObjectId(authUser.dbId);

  // Fetch DB user for clerkId and role.
  const dbUser: any = await db.collection("users").findOne({ _id: userObjectId });
  const clerkId: string | undefined =
    (dbUser?.clerkId as string | undefined) || (authUser.isClerk ? authUser.id : undefined);

  // Identify user IDs used in various collections (some store clerkId, some store dbId).
  const possibleUserIds = Array.from(
    new Set([authUser.id, authUser.dbId, clerkId].filter(Boolean) as string[]),
  );

  // Delete related data (best-effort; keep going even if one collection is missing).
  await Promise.allSettled([
    // Bookings: clientId/userId may store either clerkId or mongo _id string.
    db.collection("bookings").deleteMany({
      $or: [
        { userId: { $in: possibleUserIds } },
        { clientId: { $in: possibleUserIds } },
      ],
    }),

    // Messages: senderId is stored as dbId string in /api/chat.
    db.collection("messages").deleteMany({ senderId: authUser.dbId }),

    // Reviews: stored via Clerk currentUser().id in /api/reviews.
    db.collection("reviews").deleteMany({ userId: { $in: possibleUserIds } }),

    // Notifications: best-effort; schema varies.
    db.collection("notifications").deleteMany({
      $or: [{ userId: { $in: possibleUserIds } }, { recipientId: { $in: possibleUserIds } }],
    }),
  ]);

  // Delete user document last.
  await db.collection("users").deleteOne({ _id: userObjectId });

  // Revoke Clerk account (if present). This is required to avoid orphan auth accounts.
  if (clerkId) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkId);
    } catch (e) {
      // If Clerk deletion fails, we still confirm DB deletion to the user.
      // Human follow-up: add internal alert/logging hook so support can finish cleanup.
      console.error("Delete account: failed to delete Clerk user", e);
    }
  }

  return NextResponse.json({ success: true, deletedUserId: authUser.dbId });
}

