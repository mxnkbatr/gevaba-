import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/database/db";
import { currentUser } from "@clerk/nextjs/server";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: Request) {
  if (!JWT_SECRET) return NextResponse.json({message:'Server config error'},{status:500});
  try {
    // 1. Check Custom Cookie first
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    // Also check for Bearer token in header (for mobile apps)
    const authHeader = request.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null;

    const effectiveToken = token || bearerToken;

    if (effectiveToken) {
      try {
        const { payload } = await jwtVerify(effectiveToken, new TextEncoder().encode(JWT_SECRET));
        const userId = payload.sub as string;

        const { db } = await connectToDatabase();
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        if (user) {
          return NextResponse.json({
            user: {
              ...user,
              id: user._id,
              isAuthenticated: true,
              authType: 'custom'
            }
          });
        }
      } catch (e) {
        console.log("Custom token verification failed, checking Clerk...");
      }
    }

    // 2. Check Clerk
    // This might throw/redirect if not protected, but in an API route it usually returns null
    const clerkUser = await currentUser();

    if (clerkUser) {
      const { db } = await connectToDatabase();

      // --- LAZY SYNC IMPL ---
      // 1. Try to find user by Clerk ID
      let user: any = await db.collection("users").findOne({ clerkId: clerkUser.id });

      // 2. If user is MISSING or needs role update (optional), UPSERT them
      // For now, we focus on creation if missing, as that's the main bug.
      if (!user) {
        console.log(`[LazySync] User not found in DB. Syncing Clerk user: ${clerkUser.id}`);

        // Extract role from Clerk Metadata
        // If they signed up as Monk, this metadata should exist.
        const role = (clerkUser.unsafeMetadata?.role as string) || "client";
        const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || "";

        const newUser = {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          avatar: clerkUser.imageUrl,
          role: role, // <--- CRITICAL: Persist the role!
          phone: phone,
          createdAt: new Date(),
          // If they are a monk, ensure they have a status
          monkStatus: role === 'monk' ? 'pending' : undefined
        };

        await db.collection("users").insertOne(newUser);
        user = newUser; // Use the new user object
      }

      // --- SUPER ADMIN WHITELIST FIX ---
      // Force promote owner specific email if they are not admin
      const ownerEmails = ["puje27509@gmail.com"]; // Support both spellings

      if (user.email && ownerEmails.includes(user.email) && user.role !== "admin") {
        console.log(`[SuperAdmin] Auto-promoting owner: ${user.email}`);

        // 1. Update DB
        await db.collection("users").updateOne(
          { _id: user._id },
          { $set: { role: "admin" } }
        );

        // 2. Sync to Clerk (Crucial so claims are updated)
        try {
          const { clerkClient } = await import("@clerk/nextjs/server");
          const client = await clerkClient();
          await client.users.updateUser(clerkUser.id, {
            publicMetadata: { role: "admin" }
          });
          console.log("Synced Clerk Metadata");
        } catch (e) {
          console.error("Clerk Sync Error", e);
        }

        // Update local object so response is correct immediately
        user.role = "admin";
      }

      return NextResponse.json({
        user: {
          ...user,
          // Override/Ensure ID matches Clerk for frontend consistency
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          avatar: clerkUser.imageUrl,
          isAuthenticated: true,
          authType: 'clerk'
        }
      });
    }

    return NextResponse.json({ user: null });

  } catch (error) {
    console.error("Auth Me Error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
