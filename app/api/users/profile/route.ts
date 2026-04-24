import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const dbUser = await db.collection("users").findOne({ _id: new ObjectId(user.dbId) });

    if (!dbUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // don't return password
    const { password, ...userWithoutPassword } = dbUser;

    return NextResponse.json(userWithoutPassword);

  } catch (error: any) {
    console.error("Profile Fetch Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { firstName, lastName, dateOfBirth, zodiacYear } = await request.json();

    if (!firstName || !lastName || !dateOfBirth || !zodiacYear) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    await db.collection("users").updateOne(
      { _id: new ObjectId(user.dbId) },
      {
        $set: {
          firstName,
          lastName,
          dateOfBirth,
          zodiacYear,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({ success: true, message: "Profile updated successfully" });

  } catch (error: any) {
    console.error("Profile Update Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}

// Specific patch for lightweight updates like offline preferences or push tokens
export async function PATCH(request: Request) {
  try {
    const { fcmToken, offlineMode } = await request.json();

    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const updateSet: any = { updatedAt: new Date() };
    const updatePush: any = {};

    // PUSH TOKEN MANAGEMENT:
    // - `fcmToken` string: add/update token and add to legacy fcmTokens array
    // - `fcmToken: null`: remove legacy token fields on logout / device opt-out
    if (typeof fcmToken === "string" && fcmToken) {
      updateSet.fcmToken = fcmToken;
      updatePush.fcmTokens = fcmToken;
    }
    if (fcmToken === null) {
      updateSet.fcmToken = null;
    }

    if (offlineMode !== undefined) {
      updateSet.offlineMode = offlineMode;
    }

    const updateDoc: any = { $set: updateSet };
    if (Object.keys(updatePush).length > 0) {
      updateDoc.$addToSet = updatePush;
    }
    if (fcmToken === null) {
      updateDoc.$unset = { fcmToken: "", fcmTokens: "" };
    }

    await db.collection("users").updateOne(
      { _id: new ObjectId(user.dbId) },
      updateDoc
    );

    return NextResponse.json({ success: true, message: "Token registered" });
  } catch (error: any) {
    console.error("Profile PATCH Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
