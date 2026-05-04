import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Unified user shape returned by getAuthUser.
 * Every authenticated route gets the same object.
 */
export interface AuthUser {
  id: string;        // Clerk ID or MongoDB _id (legacy/custom)
  dbId: string;      // Always the MongoDB _id (string)
  clerkId?: string;  // Clerk ID if applicable
  fullName: string;
  role: "seeker" | "monk" | "admin";
  email?: string;
  isClerk: boolean;
}

/**
 * Resolve the authenticated user from a request.
 */
export async function getAuthUser(request?: Request): Promise<AuthUser | null> {
  try {
    // ── 1. Try custom JWT (cookie or bearer) ──
    const cookieStore = await cookies();
    const cookieToken = cookieStore.get("auth_token")?.value;

    const authHeader = request?.headers.get("Authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    const token = cookieToken || bearerToken;

    if (token && JWT_SECRET) {
      try {
        const { payload } = await jwtVerify(
          token,
          new TextEncoder().encode(JWT_SECRET)
        );

        if (payload?.sub) {
          const { db } = await connectToDatabase();
          const dbUser = await db
            .collection("users")
            .findOne({ _id: new ObjectId(payload.sub as string) });

          if (dbUser) {
            return {
              id: dbUser._id.toString(),
              dbId: dbUser._id.toString(),
              clerkId: dbUser.clerkId,
              fullName: dbUser.firstName
                ? `${dbUser.firstName} ${dbUser.lastName || ""}`.trim()
                : dbUser.phone || "User",
              role: (dbUser.role as any) || "seeker",
              email: dbUser.email,
              isClerk: !!dbUser.clerkId,
            };
          }
        }
      } catch {
        // Invalid/expired custom JWT
      }
    }

    // ── 2. Try Clerk ──
    const clerkUser = await currentUser();
    if (clerkUser) {
      const { db } = await connectToDatabase();
      let dbUser = await db
        .collection("users")
        .findOne({ clerkId: clerkUser.id });

      // If Clerk user exists but no DB record, we might want to auto-create it or just fallback
      // For now, follow the pattern of providing a fallback dbId if not found
      if (dbUser) {
        return {
          id: clerkUser.id,
          dbId: dbUser._id.toString(),
          clerkId: clerkUser.id,
          fullName:
            clerkUser.fullName ||
            `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
            "User",
          role: (dbUser.role as any) || "seeker",
          email: clerkUser.emailAddresses[0]?.emailAddress || dbUser.email,
          isClerk: true,
        };
      }

      // Fallback for new Clerk users not yet in our MongoDB
      return {
        id: clerkUser.id,
        dbId: clerkUser.id, // Temporary fallback
        clerkId: clerkUser.id,
        fullName: clerkUser.fullName || "User",
        role: "seeker",
        email: clerkUser.emailAddresses[0]?.emailAddress,
        isClerk: true,
      };
    }

    return null;
  } catch (error) {
    console.error("[lib/auth] getAuthUser error:", error);
    return null;
  }
}

/**
 * Higher-order wrapper that enforces authentication.
 *
 * Usage:
 * ```ts
 * export const GET = withAuth(async (req, user) => {
 *   // user is guaranteed to be non-null here
 *   return NextResponse.json({ hello: user.fullName });
 * });
 * ```
 *
 * @param handler - Async function receiving (request, user)
 * @returns A Next.js route handler
 */
export function withAuth(
  handler: (req: Request, user: AuthUser) => Promise<Response>
) {
  return async (req: Request) => {
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    return handler(req, user);
  };
}
