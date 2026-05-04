import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "monk") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { db } = await connectToDatabase();

    // Parallel searches for performance
    const todayStr = new Date().toISOString().split("T")[0];
    const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [pendingBookings, todayBookings, upcomingBookings, monthStats, monkProfile] = await Promise.all([
      // Pending requests
      db.collection("bookings").find({
        monkDbId: user.dbId,
        status: "pending"
      }).sort({ createdAt: -1 }).limit(20).toArray(),

      // Today's schedule
      db.collection("bookings").find({
        monkDbId: user.dbId,
        date: todayStr,
        status: { $in: ["confirmed", "completed"] }
      }).sort({ time: 1 }).toArray(),

      // Next 7 days
      db.collection("bookings").find({
        monkDbId: user.dbId,
        date: {
          $gt: todayStr,
          $lte: nextWeekStr
        },
        status: "confirmed"
      }).sort({ date: 1, time: 1 }).limit(30).toArray(),

      // Monthly stats
      db.collection("bookings").aggregate([
        {
          $match: {
            monkDbId: user.dbId,
            status: "completed",
            callEndedAt: { $gte: monthStart }
          }
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$price" },
            totalSessions: { $sum: 1 },
            totalSeconds: { $sum: "$callDurationSeconds" }
          }
        }
      ]).toArray(),

      // Profile details
      db.collection("users").findOne(
        { _id: new ObjectId(user.dbId) },
        { projection: { earnings: 1, name: 1, avatar: 1, isAvailable: 1 } }
      )
    ]);

    const stats = monthStats[0] || { totalEarnings: 0, totalSessions: 0, totalSeconds: 0 };

    return NextResponse.json({
      pendingBookings: pendingBookings.map(b => ({ ...b, _id: b._id.toString() })),
      todayBookings: todayBookings.map(b => ({ ...b, _id: b._id.toString() })),
      upcomingBookings: upcomingBookings.map(b => ({ ...b, _id: b._id.toString() })),
      monthStats: {
        earnings: stats.totalEarnings || 0,
        sessions: stats.totalSessions || 0,
        minutes: Math.round((stats.totalSeconds || 0) / 60),
        allTimeEarnings: monkProfile?.earnings || 0
      },
      isAvailable: monkProfile?.isAvailable ?? true,
      profile: monkProfile
    });
  } catch (error) {
    console.error("Monk Dashboard GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
