import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { getAuthUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/pushService";
import { ablyRest } from "@/lib/ably";

// POST — call эхлэх
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(params.id) });

    if (!booking || booking.status !== "confirmed") {
      return NextResponse.json({ error: "Booking not available for call" }, { status: 400 });
    }

    // Зөвхөн client call эхлүүлж болно
    const isClient = booking.clientId === user.dbId || booking.userId === user.dbId;
    if (!isClient && user.role !== "admin") {
      return NextResponse.json({ error: "Only client can initiate call" }, { status: 403 });
    }

    // callStatus update
    await db.collection("bookings").updateOne(
      { _id: new ObjectId(params.id) },
      { $set: { callStatus: "in_call", callStartedAt: new Date(), updatedAt: new Date() } }
    );

    // ════ ЛAMT-Д PUSH NOTIFICATION ИЛГЭЭ ════
    if (booking.monkDbId) {
      await sendPushToUser({
        userId: booking.monkDbId,
        title: "📞 Дуудлага ирж байна!",
        body: `${booking.clientName || "Хэрэглэгч"} дуудлага эхлүүллээ. Одоо нэвтрэх!`,
        data: {
          type: "call_incoming",
          bookingId: params.id,
          roomName: `booking-${params.id}`,
          url: `/booking/${params.id}`
        }
      });

      // Ably-р лам-д real-time дуудлага мэдэгдэл
      try {
        await ablyRest.channels.get(`monk:${booking.monkDbId}:calls`).publish("incoming_call", {
          bookingId: params.id,
          clientName: booking.clientName || "Хэрэглэгч",
          roomName: `booking-${params.id}`,
        });
      } catch (e) {
        console.error("Ably publish error:", e);
      }
    }

    return NextResponse.json({ success: true, roomName: `booking-${params.id}` });
  } catch (error) {
    console.error("Call POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE — call дуусгах
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { db } = await connectToDatabase();
    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(params.id) });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const callStart = booking.callStartedAt ? new Date(booking.callStartedAt).getTime() : 0;
    const durationSec = callStart ? Math.round((Date.now() - callStart) / 1000) : 0;

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          status: "completed",
          callStatus: "ended",
          callEndedAt: new Date(),
          callDurationSeconds: durationSec,
          updatedAt: new Date()
        }
      }
    );

    // Хоёр талд summary push
    const summary = `Дуудлага ${Math.floor(durationSec/60)} мин ${durationSec%60} сек үргэлжиллээ.`;
    
    if (booking.clientId) {
      sendPushToUser({ 
        userId: booking.clientId, 
        title: "📋 Засал дууслаа", 
        body: summary,
        data: { type: "call_ended", bookingId: params.id } 
      }).catch(console.error);
    }
    
    if (booking.monkDbId) {
      sendPushToUser({ 
        userId: booking.monkDbId, 
        title: "✅ Засал дууслаа", 
        body: summary,
        data: { type: "call_ended", bookingId: params.id } 
      }).catch(console.error);
      
      // Орлого нэм — лам-д
      if (booking.price) {
        await db.collection("users").updateOne(
          { _id: new ObjectId(booking.monkDbId) },
          { $inc: { earnings: booking.price } }
        );
      }
    }

    return NextResponse.json({ success: true, durationSeconds: durationSec });
  } catch (error) {
    console.error("Call DELETE error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
