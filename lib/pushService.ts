import { connectToDatabase } from "@/database/db";
import { ObjectId } from "mongodb";

// Lazy singleton — only init once
let _firebase: any = null;

async function getFirebase() {
  if (typeof window !== "undefined") return null;
  if (_firebase) return _firebase;
  try {
    const fa = await import("firebase-admin");
    if (!fa.default.apps?.length) {
      const svc = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (!svc) {
        console.warn("🔥 FCM: FIREBASE_SERVICE_ACCOUNT missing");
        return null;
      }
      fa.default.initializeApp({
        credential: fa.default.credential.cert(JSON.parse(svc)),
      });
      console.log("🔥 Firebase Admin initialized");
    }
    _firebase = fa.default;
    return _firebase;
  } catch (e) {
    console.error("🔥 Firebase init error:", e);
    return null;
  }
}

interface PushPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * Sends a push notification to a specific user by their MongoDB _id or Clerk ID.
 */
export async function sendPushToUser(payload: PushPayload) {
  const { userId, title, body, data, imageUrl } = payload;
  try {
    const firebase = await getFirebase();
    if (!firebase) return { success: false, error: "Firebase not ready" };

    const { db } = await connectToDatabase();
    const user = await db.collection("users").findOne({
      $or: [
        ...(ObjectId.isValid(userId) ? [{ _id: new ObjectId(userId) }] : []),
        { clerkId: userId },
      ],
    });

    if (!user) return { success: false, error: "User not found" };

    // Consolidate tokens
    const tokens: string[] = [];
    if (user.fcmTokens && Array.isArray(user.fcmTokens)) tokens.push(...user.fcmTokens);
    if (user.fcmToken) tokens.push(user.fcmToken);
    // Compatibility with old models
    if (user.pushTokens && Array.isArray(user.pushTokens)) {
      user.pushTokens.forEach((t: any) => tokens.push(t.token));
    }

    const uniqueTokens = Array.from(new Set(tokens.filter((t) => !!t)));
    if (uniqueTokens.length === 0) return { success: false, error: "No tokens" };

    const messages = uniqueTokens.map((token) => ({
      token,
      notification: { title, body, ...(imageUrl ? { imageUrl } : {}) },
      data: data || {},
      android: { priority: "high" as const },
      apns: { payload: { aps: { sound: "default", badge: 1 } } },
    }));

    const response = await firebase.messaging().sendEach(messages);
    
    // Cleanup invalid tokens
    const invalidTokens: string[] = [];
    response.responses.forEach((resp: any, idx: number) => {
      if (!resp.success) {
        const code = resp.error?.code;
        if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-argument") {
          invalidTokens.push(uniqueTokens[idx]);
        }
      }
    });

    if (invalidTokens.length > 0) {
      await db.collection("users").updateOne(
        { _id: user._id },
        { 
          $pull: { 
            fcmTokens: { $in: invalidTokens },
            pushTokens: { token: { $in: invalidTokens } }
          } as any,
          ...(user.fcmToken && invalidTokens.includes(user.fcmToken) ? { $unset: { fcmToken: "" } } : {})
        }
      );
    }

    return { success: true, count: response.successCount };
  } catch (error) {
    console.error("🔥 Push Error:", error);
    return { success: false, error };
  }
}

/**
 * Broadcast notification to multiple users
 */
export async function sendPushToAllUsers({ 
  title, 
  body, 
  data, 
  role 
}: { 
  title: string; 
  body: string; 
  data?: Record<string, string>; 
  role?: string 
}) {
  try {
    const firebase = await getFirebase();
    if (!firebase) return;

    const { db } = await connectToDatabase();
    const filter = role ? { role } : {};
    const users = await db.collection("users").find(filter, { projection: { _id: 1 } }).toArray();

    console.log(`🔥 Broadcasting to ${users.length} users (role: ${role || 'all'})`);

    for (const user of users) {
      await sendPushToUser({ userId: user._id.toString(), title, body, data });
    }
  } catch (error) {
    console.error("🔥 Broadcast Error:", error);
  }
}
