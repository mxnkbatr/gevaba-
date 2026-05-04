import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";
import { sendBookingNotification } from "@/lib/mail";
import { getAuthUser } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET;

import { withCache, invalidateCache } from "@/lib/api/cache";

export async function GET(request: Request) {
  if (!JWT_SECRET) return NextResponse.json({message:'Server config error'},{status:500});
  try {
    const { searchParams } = new URL(request.url);
    const monkId = searchParams.get("monkId");
    const userEmail = searchParams.get("userEmail");
    const userId = searchParams.get("userId");
    const userPhone = searchParams.get("userPhone");
    const date = searchParams.get("date");

    if (!monkId && !userEmail && !userId && !userPhone) {
      return NextResponse.json({ message: "Missing search parameter" }, { status: 400 });
    }

    const cacheKey = `bookings:${monkId || 'all'}:${date || 'all'}:${userId || 'all'}:${userEmail || 'all'}:${userPhone || 'all'}`;
    const ttl = monkId ? 30 : 60; // Shorter TTL for schedule freshness

    const { bookings, times } = await withCache(cacheKey, async () => {
      const { db } = await connectToDatabase();
      const query: any = {};

      if (monkId) query.monkId = monkId;
      if (userEmail) query.userEmail = userEmail;
      if (userPhone) query.userPhone = userPhone;
      
      if (userId) {
        // Parallelize user lookup
        const userIdsToSearch = [userId];
        const lookupResult = await (async () => {
          try {
            if (ObjectId.isValid(userId)) {
              return await db.collection("users").findOne({ _id: new ObjectId(userId) });
            } else if (userId.startsWith("user_")) {
              return await db.collection("users").findOne({ clerkId: userId });
            }
          } catch { return null; }
          return null;
        })();

        if (lookupResult) {
          if (lookupResult.clerkId) userIdsToSearch.push(lookupResult.clerkId);
          userIdsToSearch.push(lookupResult._id.toString());
        }
        query.$or = [{ userId: { $in: userIdsToSearch } }, { clientId: { $in: userIdsToSearch } }];
      }

      if (date) query.date = date;

      const results = await db.collection("bookings")
        .find(query)
        .sort({ date: 1, time: 1 })
        .limit(100)
        .toArray();

      let timesResult = null;
      if (monkId && date) {
        timesResult = results.filter(b => b.status !== 'rejected' && b.status !== 'cancelled').map(b => b.time);
      }

      return { bookings: results, times: timesResult };
    }, ttl);

    if (monkId && date) {
      return NextResponse.json(times);
    }

    return NextResponse.json(bookings);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching bookings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const authenticatedUserId = user.dbId;

    const body = await request.json();
    const { monkId, date, time, userName, userEmail, userPhone, serviceId, note } = body;

    if (!userPhone) return NextResponse.json({ message: "Phone number is required." }, { status: 400 });

    const { db } = await connectToDatabase();

    // 1. past date check
    const [hours, minutes] = time.split(':').map(Number);
    const [year, month, day] = date.split('-').map(Number);
    const bookingDateOnly = new Date(year, month - 1, day);
    const todayDateOnly = new Date();
    todayDateOnly.setHours(0, 0, 0, 0);

    if (bookingDateOnly < todayDateOnly) return NextResponse.json({ message: "Cannot book dates in the past." }, { status: 400 });

    // 2. Atomic Slot Lock
    await db.collection('booking_locks').deleteMany({ expiresAt: { $lte: new Date() } });
    let lockId: any = null;
    try {
      const lockResult = await db.collection('booking_locks').insertOne({
        monkId, date, time, lockedAt: new Date(), lockedBy: authenticatedUserId, expiresAt: new Date(Date.now() + 30000)
      });
      lockId = lockResult.insertedId;
    } catch (lockErr: any) {
      if (lockErr.code === 11000) return NextResponse.json({ message: 'Энэ цаг дээр өөр хүн ажиллаж байна, дахин оролдоно уу' }, { status: 409 });
      throw lockErr;
    }

    const existing = await db.collection("bookings").findOne({ monkId, date, time, status: { $in: ['confirmed', 'pending'] } });
    if (existing) {
      if (lockId) await db.collection('booking_locks').deleteOne({ _id: lockId });
      return NextResponse.json({ message: 'Энэ цаг аль хэдийн захиалагдсан байна' }, { status: 409 });
    }

    // 3. Monk & Service Details
    const monkQuery = ObjectId.isValid(monkId) ? { _id: new ObjectId(monkId) } : { _id: monkId };
    const monk = await db.collection("users").findOne(monkQuery);
    let serviceName = "Spiritual Session";
    let price = 0;

    if (serviceId) {
      if (ObjectId.isValid(serviceId)) {
        const serviceDoc = await db.collection("services").findOne({ _id: new ObjectId(serviceId) });
        if (serviceDoc) {
          serviceName = serviceDoc.title?.en || serviceDoc.title?.mn || serviceName;
          price = serviceDoc.price || 0;
        }
      }
      if (serviceName === "Spiritual Session" && monk?.services) {
        const embedded = monk.services.find((s: any) => s.id === serviceId);
        if (embedded) {
          serviceName = embedded.name?.en || embedded.name?.mn || serviceName;
          price = embedded.price || 0;
        }
      }
    }

    // 4. Save Booking & Send Notifications & In-App Notice PARALLEL
    const monkDbId = monk?._id.toString();
    const newBooking = {
      userId: user.id, // Legacy field
      clientId: authenticatedUserId, // Consistent MongoDB _id
      monkId, // Legacy field
      monkDbId, // Resolved MongoDB _id
      clientName: userName || user.fullName,
      monkName: monk?.name?.mn || monk?.name?.en,
      serviceName: { en: serviceName, mn: serviceName },
      price,
      date, 
      time, 
      userEmail, 
      userPhone, 
      note, 
      status: 'pending', 
      callStatus: 'idle',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const [result] = await Promise.all([
      db.collection("bookings").insertOne(newBooking),
      (async () => {
        try {
          const emailPromises = [];
          if (userEmail) {
            emailPromises.push(sendBookingNotification({
              userEmail, userName, monkName: monk?.name?.en || monk?.name?.mn || "The Monk", serviceName, date, time
            }));
          }
          if (monk?.email) {
            emailPromises.push(sendBookingNotification({
              userEmail: monk.email, userName: `[Шинэ захиалга] ${userName}`, monkName: monk?.name?.mn || monk?.name?.en || 'Та', serviceName, date, time
            }));
          }
          await Promise.all(emailPromises);
        } catch (e) {}
      })(),
      (async () => {
        try {
          // Push notification to Monk
          if (monkDbId) {
            const { sendPushToUser } = await import("@/lib/pushService");
            await sendPushToUser({
              userId: monkDbId,
              title: "🔔 Шинэ захиалга ирлээ",
              body: `${userName || user.fullName} — ${date} ${time}`,
              data: { type: "new_booking", url: "/monk/dashboard" }
            });

            // Ably real-time event to Monk
            try {
              const { ablyRest } = await import("@/lib/ably");
              await ablyRest.channels.get(`monk:${monkDbId}:bookings`).publish("new_booking", {
                clientName: userName || user.fullName,
                date,
                time,
              });
            } catch (ablyErr) {
              console.error("Ably error in booking POST:", ablyErr);
            }
          }

          // In-app notifications
          await db.collection("notifications").insertOne({
            userId: authenticatedUserId,
            title: { mn: "Захиалга илгээгдлээ", en: "Booking Requested" },
            message: { 
              mn: `${monk?.name?.mn || "Лам"}-д засал захиалах хүсэлт илгээгдлээ.`, 
              en: `Request sent to ${monk?.name?.en || "the Monk"} for a session.` 
            },
            type: "booking", read: false, createdAt: new Date()
          });

          if (monkDbId) {
             await db.collection("notifications").insertOne({
              userId: monkDbId,
              title: { mn: "Шинэ захиалга", en: "New Booking" },
              message: { 
                mn: `Танд ${userName || "Хэрэглэгч"}-ээс ${date}-ны ${time} цагт шинэ захиалга ирлээ.`, 
                en: `You have a new booking from ${userName || "User"} on ${date} at ${time}.` 
              },
              type: "booking", read: false, createdAt: new Date()
            });
          }
        } catch (e) {
          console.error("Notification Error in booking POST:", e);
        }
      })()
    ]);

    if (lockId) await db.collection('booking_locks').deleteOne({ _id: lockId });

    await invalidateCache('bookings:*');

    return NextResponse.json({ success: true, id: result.insertedId });
  } catch (error: any) {
    console.error("Booking Error:", error);
    return NextResponse.json({ message: "Booking failed", error: error.message }, { status: 500 });
  }
}