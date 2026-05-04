import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { sendBookingStatusUpdate } from "@/lib/mail";
import { getAuthUser } from "@/lib/auth";
import { invalidateCache } from "@/lib/api/cache";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const { id } = params;
    const { status, callStatus, isManual } = await req.json();

    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    const booking = await db.collection("bookings").findOne({ _id: new ObjectId(id) });

    if (!booking) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    // Authorization Check
    const isClient = booking.clientId === user.id || booking.userId === user.id
      || booking.clientId === user.dbId || booking.userId === user.dbId;
    const isAdmin = user.role === "admin";

    let isMonk = false;
    let monkProfile = null;

    if (booking.monkId) {
      try {
        monkProfile = await db.collection("users").findOne({ _id: new ObjectId(booking.monkId) });
        if (monkProfile && (monkProfile.clerkId === user.id || monkProfile._id.toString() === user.dbId)) {
          isMonk = true;
        }
      } catch (e) {
        console.error("Error fetching monk for auth check", e);
      }
    }

    if (!isMonk && !isAdmin && !isClient) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Validation: Only Monks/Admins can confirm, reject, or mark as manual
    if (status === 'confirmed' || status === 'rejected' || isManual !== undefined) {
      if (!isMonk && !isAdmin) {
        return NextResponse.json({ message: "Only monks can manage booking lifecycle" }, { status: 403 });
      }
    }

    // Update the Booking
    const updateData: any = { updatedAt: new Date() };
    if (status) updateData.status = status;
    if (isManual !== undefined) updateData.isManual = isManual;
    if (callStatus) {
      if (callStatus === 'active' && !isMonk && !isAdmin) {
        return NextResponse.json({ message: "Only monks can start calls" }, { status: 403 });
      }
      updateData.callStatus = callStatus;
    }

    // 3. callStatus = "waiting" болго — дуудлага хүлээж байна
    if (status === 'confirmed') {
      updateData.callStatus = "waiting";
    }

    await db.collection("bookings").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Send Notification Logic
    if (status === 'confirmed' || status === 'rejected') {
      if (!monkProfile && (booking.monkDbId || booking.monkId)) {
        monkProfile = await db.collection("users").findOne({ 
          _id: new ObjectId(booking.monkDbId || booking.monkId) 
        });
      }

      const monkName = monkProfile?.name?.mn || monkProfile?.name?.en || "Лам";
      const serviceName = booking.serviceName?.mn || booking.serviceName?.en || "Засал";

      if (booking.userEmail) {
        try {
          await sendBookingStatusUpdate({
            userEmail: booking.userEmail,
            userName: booking.clientName || "Хэрэглэгч",
            monkName,
            serviceName,
            date: booking.date,
            time: booking.time,
            status
          });
        } catch (mailErr) {
          console.error("Email notification failed:", mailErr);
        }
      }

      // Add In-App and Push Notification
      try {
        const clientId = booking.clientId || booking.userId;
        if (clientId) {
          await db.collection("notifications").insertOne({
            userId: clientId,
            title: status === 'confirmed'
              ? { mn: "✅ Захиалга баталгаажлаа!", en: "✅ Booking Confirmed!" }
              : { mn: "❌ Захиалга цуцлагдлаа", en: "❌ Booking Rejected" },
            message: status === 'confirmed'
              ? {
                  mn: `${booking.date} ${booking.time} цагийн захиалга батлагдлаа. Та дуудлага эхлүүлж болно.`,
                  en: `Your booking for ${booking.date} at ${booking.time} is confirmed. You can now start the call.`
                }
              : {
                  mn: `${monkName} таны захиалгыг цуцаллаа.`,
                  en: `${monkName} has rejected your booking request.`
                },
            type: "booking",
            bookingId: id,
            read: false,
            createdAt: new Date()
          });

          // TRIGGER PUSH NOTIFICATION
          try {
            const { sendPushToUser } = await import("@/lib/pushService");
            
            // Notify User
            await sendPushToUser({
              userId: clientId,
              title: status === 'confirmed' ? "✅ Захиалга батлагдлаа!" : "❌ Захиалга цуцлагдлаа",
              body: status === 'confirmed'
                ? `${booking.date} ${booking.time} цагийн захиалга батлагдлаа.`
                : `${monkName} таны захиалгыг цуцаллаа.`,
              data: { type: "booking_confirmed", bookingId: id, url: `/booking/${id}` }
            });

            // TRIGGER ABLY REAL-TIME
            try {
              const { ablyRest } = await import("@/lib/ably");
              await ablyRest.channels.get(`booking:${clientId}:status`).publish(status, {
                bookingId: id,
                status,
                monkName,
              });
            } catch (ablyErr) {
              console.error("Ably error in booking PATCH:", ablyErr);
            }
          } catch (pushErr) {
            console.error("Push Notification failed:", pushErr);
          }
        }
      } catch (err) {
        console.error("Failed to create status notification:", err);
      }
    }

    await invalidateCache('bookings:*');
    return NextResponse.json({ message: "Booking updated", success: true });

  } catch (error: any) {
    console.error("Booking PATCH Error:", error);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ message: "Invalid Booking ID" }, { status: 400 });
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

    const isClient = booking.clientId === user.id || booking.userId === user.id
      || booking.clientId === user.dbId || booking.userId === user.dbId;
    const isAdmin = user.role === "admin";

    let isMonk = false;
    if (booking.monkId) {
      try {
        const monkProfile = await db.collection("users").findOne({ _id: new ObjectId(booking.monkId) });
        if (monkProfile && (monkProfile.clerkId === user.id || monkProfile._id.toString() === user.dbId)) {
          isMonk = true;
        }
      } catch (e) {
        console.error("Error fetching monk for auth check", e);
      }
    }

    if (!isClient && !isMonk && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const result = await db.collection("bookings").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Booking not found" }, { status: 404 });
    }

    await invalidateCache('bookings:*');
    return NextResponse.json({ message: "Booking deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: "Error deleting", error: error.message }, { status: 500 });
  }
}