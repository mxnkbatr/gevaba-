import { AccessToken } from "livekit-server-sdk";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

/**
 * GET handler to issue LiveKit access tokens for rooms.
 * Securely verifies user identity via centralized auth before issuing.
 */
export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room");
  const username = req.nextUrl.searchParams.get("username");

  if (!room || !username) {
    return NextResponse.json({ error: 'Missing "room" or "username"' }, { status: 400 });
  }

  // Authenticate via centralized auth
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Room must follow "booking-{id}" format
  const bookingId = room.replace("booking-", "");
  if (!bookingId || bookingId === room) {
    return NextResponse.json({ error: "Invalid room format" }, { status: 400 });
  }

  const { connectToDatabase } = await import("@/database/db");
  const { ObjectId } = await import("mongodb");
  const { db } = await connectToDatabase();

  const booking = await db.collection("bookings").findOne({
    _id: new ObjectId(bookingId),
    status: "confirmed"
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found or not confirmed" }, { status: 403 });
  }

  // Ensure user is authorized for this specific booking
  const isParticipant =
    booking.clientId === user.dbId ||
    booking.userId === user.dbId ||
    booking.monkId?.toString() === user.dbId ||
    booking.monkDbId === user.dbId ||
    user.role === "admin";

  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden: You are not part of this booking" }, { status: 403 });
  }

  // Token Generation
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: user.dbId,
    name: username,
    ttl: "2h",
  });

  at.addGrant({
    roomJoin: true,
    room: room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  return NextResponse.json({ 
    token: await at.toJwt(),
    wsUrl 
  });
}
