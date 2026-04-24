# Google Play Data Safety (mn.gevabal.buddha)

This document is intended to help fill in the **Play Console → App content → Data safety** form.

## Data collected (by the app)
- **User profile data**: account identifier, profile image (camera/gallery), role/metadata (Clerk + app DB)
- **Messages / communications**: in-app chat/messaging content (if enabled)
- **Payments**: payment initiation and status for QPay (invoice/payment status, order identifiers)
- **Device & app diagnostics (limited)**: logs needed for troubleshooting (avoid logging secrets)
- **Push notification tokens**: FCM/APNs tokens stored per user/device to deliver notifications

## Data shared (with third parties)
- **Clerk (authentication)**: sign-in/sign-up, session management
- **Firebase (FCM push notifications)**: device push tokens and delivery
- **Image CDN / storage**: profile or content images (e.g., Cloudinary) if configured
- **Payment provider (QPay)**: payment requests and status checks

## Purpose of collection
- **Account management** (sign-in, identity, roles)
- **Core app functionality** (booking, messaging, payments)
- **Notifications** (session reminders / updates)
- **Fraud prevention / security** (auth verification, webhook validation where applicable)

## Processing & security
- **Encryption in transit**: Yes (HTTPS/WSS). Cleartext traffic is disabled in release Android manifest.
- **Encryption at rest**: Depends on backend storage (DB and provider configurations).
- **Access controls**: Authentication via Clerk and/or server-side JWT verification.

## Data deletion
- **User-initiated deletion**: Users should be able to request account/data deletion.
- **Recommended policy**:
  - Provide an in-app path: **Profile → Settings → Delete account**
  - Or provide a support contact (email/URL) for deletion requests

> Update this section with the exact in-app flow or support endpoint once finalized.

## Location
- **Location data**: Not collected (unless you add a location plugin/permission in the future).

