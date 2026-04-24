import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * Initializes Capacitor Push Notifications and sets up listeners.
 * Only runs on native platforms (Android/iOS).
 * 
 * @param userId The MongoDB _id of the current user to link the token to.
 * @param router Next.js router instance for deep linking (passed from component).
 */
export async function initPushNotifications(userId: string, router: any) {
  if (!Capacitor.isNativePlatform()) return;
  
  // Initialize push notifications (native only).

  // PRODUCTION UX GUIDANCE:
  // Do NOT show the OS permission prompt on first launch.
  // Instead, call requestPushPermissionAndRegister() from a user-driven UI moment
  // (e.g., after booking a session, enabling reminders, or toggling "Notifications" in settings).
  const current = await PushNotifications.checkPermissions();
  if (current.receive !== 'granted') {
    console.warn('🔔 Push Notifications permission not granted yet (skipping register).');
    return;
  }
  
  // 2. Register with FCM/APNS (only when permission already granted)
  await PushNotifications.register();
  
  // 3. LISTENERS
  
  // Token registration
  PushNotifications.addListener('registration', async (token) => {
    // Registration success; persist token server-side (do not log tokens in production).
    // Update the user profile with the new FCM token
    try {
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fcmToken: token.value })
      });
    } catch (err) {
      console.error('🔔 Failed to save FCM token to backend:', err);
    }
  });

  // Registration error
  PushNotifications.addListener('registrationError', (error) => {
    console.error('🔔 Push registration error:', error);
  });
  
  // Notification received while app is OPEN
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // App is open: optionally show in-app toast / banner.
    // You can implement an in-app toast notification here if desired
    // showInAppNotification(notification);
  });
  
  // Notification ACTION performed (Tapping the notification)
  PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
    // User tapped a notification: deep-link based on payload.
    const data = action.notification.data;
    
    if (data.type === 'booking' && data.bookingId) {
      router.push(`/profile`); // Deep link to profile or specific booking if URL pattern exists
    } else if (data.type === 'message' && data.senderId) {
      router.push(`/messenger?monkId=${data.senderId}`);
    } else if (data.link) {
      router.push(data.link);
    }
  });
}

/**
 * Call this from an explicit user action (recommended for App Store review compliance),
 * e.g. "Enable reminders" button.
 */
export async function requestPushPermissionAndRegister(userId: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  const permission = await PushNotifications.requestPermissions();
  if (permission.receive !== 'granted') return false;
  await PushNotifications.register();
  // Token is saved by the 'registration' listener (initPushNotifications) once listeners are set.
  // If you call this without initPushNotifications running, token will still be generated,
  // but you should add your own 'registration' listener to persist it.
  return true;
}
