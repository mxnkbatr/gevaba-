import { NextResponse } from "next/server";
import { ablyRest } from "@/lib/ably";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.ABLY_API_KEY) {
      return NextResponse.json({ error: "Ably not configured" }, { status: 500 });
    }

    const tokenRequest = await ablyRest.auth.createTokenRequest({
      clientId: user.dbId,
      capability: {
        // Seeker: only their own booking status channel
        [`booking:${user.dbId}:*`]: ["subscribe", "publish"],
        // Monk: their monk-specific notifications and bookings
        ...(user.role === "monk" ? { [`monk:${user.dbId}:*`]: ["subscribe", "publish"] } : {}),
        // Admin: all channels
        ...(user.role === "admin" ? { "*": ["subscribe", "publish"] } : {}),
      },
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    console.error("Ably token error:", error);
    return NextResponse.json({ message: "Failed to create token" }, { status: 500 });
  }
}
