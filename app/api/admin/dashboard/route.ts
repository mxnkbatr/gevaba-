import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { db } = await connectToDatabase();
    const today = new Date().toISOString().split("T")[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalUsers, totalMonks, pendingMonks,
      todayBookings, monthRevenue, allBookings,
      recentUsers
    ] = await Promise.all([
      db.collection("users").countDocuments({ role: "seeker" }),
      db.collection("users").countDocuments({ role: "monk", monkStatus: "approved" }),
      db.collection("users").countDocuments({ role: "monk", monkStatus: "pending" }),
      db.collection("bookings").countDocuments({ date: today }),
      db.collection("bookings").aggregate([
        { $match: { status: "completed", callEndedAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$price" } } }
      ]).toArray(),
      db.collection("bookings").find({}).sort({ createdAt: -1 }).limit(50).toArray(),
      db.collection("users").find({ role: "seeker" }).sort({ createdAt: -1 }).limit(20)
        .project({ _id: 1, email: 1, firstName: 1, lastName: 1, createdAt: 1 }).toArray()
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalMonks,
        pendingMonks,
        todayBookings,
        monthRevenue: monthRevenue[0]?.total || 0
      },
      recentBookings: allBookings.map(b => ({ ...b, _id: b._id.toString() })),
      recentUsers: recentUsers.map(u => ({ ...u, _id: u._id.toString() }))
    });
  } catch (error) {
    console.error("Admin Dashboard GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
