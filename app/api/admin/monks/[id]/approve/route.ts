import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/pushService";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const { approved, reason } = await req.json();

    const { db } = await connectToDatabase();
    const monk = await db.collection("users").findOne({ _id: new ObjectId(id) });
    if (!monk) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: {
        monkStatus: approved ? "approved" : "rejected",
        role: approved ? "monk" : "seeker",
        isAvailable: approved ? true : false,
        updatedAt: new Date()
      }}
    );

    // Notification to the monk candidate
    if (monk.fcmTokens || monk.fcmToken || monk.clerkId) {
      await sendPushToUser({
        userId: id,
        title: approved ? "🎉 Таны өргөдөл батлагдлаа!" : "❌ Өргөдөл татгалзагдлаа",
        body: approved
          ? "Та одоо Гэвабал дээр засал хийх боломжтой боллоо."
          : (reason || "Өргөдөл хянагдаж, дахин илгээж болно."),
        data: { type: "monk_approval", approved: approved.toString() }
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Monk Approve error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
