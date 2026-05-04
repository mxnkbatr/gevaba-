import { getCollection } from "@/app/lib/mongodb";
import { sendPushToUser } from "@/lib/pushService";

export async function notifyAdminNewOrder(
  orderId: string,
  customerName: string,
  total: number,
) {
  try {
    const usersCollection = await getCollection("users");
    const notificationsCollection = await getCollection("notifications");

    const admins = await usersCollection.find({ role: "admin" }).toArray();

    if (admins.length > 0) {
      const notifications = admins.map((admin) => ({
        userId: admin._id.toString(),
        title: "🛒 Шинэ захиалга баталгаажлаа!",
        message: `${customerName} хэрэглэгчээс - ${total}₮`,
        type: "order",
        isRead: false,
        link: `/admin/orders`,
        createdAt: new Date(),
      }));

      await notificationsCollection.insertMany(notifications);

      // Send FCM push to each admin's phone (non-blocking)
      for (const admin of admins) {
        sendPushToUser({
          userId: admin._id.toString(),
          title: "🛒 Шинэ захиалга!",
          body: `${customerName} - ${total.toLocaleString()}₮`,
          data: { type: "booking", bookingId: orderId, url: "/admin/orders" },
        }).catch((err: unknown) => console.error("FCM admin push error:", err));
      }

      console.log(
        `[AdminNotifications] Sent notifications to ${admins.length} admins for order ${orderId}`,
      );
    }
  } catch (error) {
    console.error("Failed to send admin notifications:", error);
  }
}
