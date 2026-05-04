import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { ablyRest } from "@/lib/ably";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ monkId: string }> }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const { monkId } = await params;
    const currentUserId = user.dbId;

    const participant1 = currentUserId;
    const participant2 = monkId;

    const messages = await db.collection("direct_messages")
      .find({
        $or: [
          { senderId: participant1, receiverId: participant2 },
          { senderId: participant2, receiverId: participant1 }
        ]
      })
      .sort({ createdAt: 1 })
      .toArray();

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET Messages Error:", error);
    return NextResponse.json({ message: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ monkId: string }> }) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const { monkId } = await params;
    const receiverId = monkId;
    const senderId = user.dbId;

    const body = await request.json();
    const { text, imageUrl } = body;

    if (!text && !imageUrl) {
      return NextResponse.json({ message: "Message content cannot be empty" }, { status: 400 });
    }

    // Use fullName from the centralized auth, or look up from DB for richer name
    let senderName = user.fullName;
    try {
      const dbUser = await db.collection("users").findOne({ _id: new ObjectId(senderId) });
      if (dbUser) {
        senderName = dbUser.name?.mn || dbUser.name?.en || dbUser.name || dbUser.firstName || senderName;
      }
    } catch { /* use auth fullName as fallback */ }

    const newMessage = {
      _id: new ObjectId(),
      senderId,
      receiverId,
      senderName,
      text: text || "",
      imageUrl: imageUrl || null,
      createdAt: new Date().toISOString(),
      read: false
    };

    await db.collection("direct_messages").insertOne(newMessage);

    // IN-APP NOTIFICATION
    try {
      const isSenderMonk = user.role === "monk" || user.role === "admin";
      
      let titleMN = "";
      let titleEN = "";
      let messageMN = text || "Шинэ зураг илгээлээ";
      let messageEN = text || "Sent a new image";

      // If sender is monk, they are messaging a user
      if (isSenderMonk) {
        titleMN = `${senderName} багш танд зурвас илгээлээ`;
        titleEN = `Monk ${senderName} sent you a message`;
      } else {
        // Sender is user, messaging a monk
        titleMN = `${senderName} танд зурвас илгээлээ`;
        titleEN = `${senderName} sent you a message`;
      }

      await db.collection("notifications").insertOne({
        userId: receiverId,
        title: { mn: titleMN, en: titleEN },
        message: { mn: messageMN, en: messageEN },
        type: "message",
        read: false,
        link: `/messenger`,
        createdAt: new Date()
      });
    } catch (notifErr) {
      console.error("Failed to create in-app notification:", notifErr);
    }

    // Publish real-time event to recipient's Ably channel
    try {
      const channel = ablyRest.channels.get(`chat:${receiverId}`);
      await channel.publish("new_message", newMessage);
    } catch (ablyErr) {
      console.error("Ably publish failed:", ablyErr);
    }

    // TRIGGER PUSH NOTIFICATION
    try {
      const { sendPushToUser } = await import("@/lib/pushService");
      await sendPushToUser({
        userId: receiverId,
        title: `Шинэ зурвас: ${senderName}`,
        body: text || "Зураг илгээлээ",
        data: { type: "message", senderId: senderId }
      });
    } catch (pushErr) {
      console.error("Push Notification for message failed:", pushErr);
    }

    return NextResponse.json(newMessage);
  } catch (error) {
    console.error("POST Message Error:", error);
    return NextResponse.json({ message: "Failed to send message" }, { status: 500 });
  }
}
