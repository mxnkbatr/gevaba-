import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const user = await getAuthUser(req);
    if (!user || user.role !== "monk") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { isAvailable } = await req.json();
    const { db } = await connectToDatabase();

    await db.collection("users").updateOne(
      { _id: new ObjectId(user.dbId) },
      { $set: { isAvailable: Boolean(isAvailable), updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true, isAvailable });
  } catch (error) {
    console.error("Monk Availability PATCH error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
