import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { invalidateCache } from "@/lib/api/cache";

type Props = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, props: Props) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid booking ID" }, { status: 400 });
    }

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });
    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Authorization: Monk who is assigned, or Admin
    const isAssignedMonk = booking.monkDbId === user.dbId || booking.monkId?.toString() === user.dbId;
    const isAdmin = user.role === "admin";

    if (!isAssignedMonk && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    if (booking.status === 'completed') {
      return NextResponse.json({ message: "Booking already completed" });
    }

    // 4. Update Monk's Earnings
    const monkDbId = booking.monkDbId || booking.monkId;
    if (monkDbId) {
      const monkQuery = ObjectId.isValid(monkDbId) ? { _id: new ObjectId(monkDbId) } : { _id: monkDbId };
      const monk = await db.collection("users").findOne(monkQuery);

      if (monk) {
        const earningsAmount = booking.price || (monk.isSpecial ? 88800 : 40000);
        await db.collection("users").updateOne(monkQuery, { $inc: { earnings: earningsAmount } });

        // Commission for special monks if non-special monk did the work
        if (!monk.isSpecial) {
          await db.collection("users").updateMany(
            { role: "monk", isSpecial: true, _id: { $ne: monk._id } },
            { $inc: { earnings: 10000 } }
          );
        }
      }
    }

    // 5. Cleanup and Status Update
    await db.collection("messages").deleteMany({ bookingId: id });
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: { 
        status: 'completed', 
        callStatus: 'ended',
        callEndedAt: new Date(),
        updatedAt: new Date() 
      } }
    );

    await invalidateCache('bookings:*');

    return NextResponse.json({ success: true, message: "Booking completed" });

  } catch (error: any) {
    console.error("Complete Booking Error:", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
}
