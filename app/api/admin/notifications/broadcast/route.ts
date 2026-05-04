import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { getAuthUser } from "@/lib/auth";
import { sendPushToAllUsers } from "@/lib/pushService";

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { title, body, targetRole, data } = await req.json();
    // targetRole: "all" | "seeker" | "monk"

    await sendPushToAllUsers({
      title,
      body,
      data,
      role: targetRole === "all" ? undefined : targetRole
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Broadcast error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
