# App Store Privacy Details — Gevabal (`mn.gevabal.buddha`)

This document maps the current codebase to Apple’s **App Privacy “Nutrition Label”** categories.

Human review needed: verify any additional SDKs (analytics/crash reporting) added during release builds.

## Data Used to Track You
- **None** (no advertising SDKs, cross‑app tracking, or third‑party ad attribution logic found in the codebase).

## Data Linked to You

### Contact Info
- **Email address**: collected via Clerk authentication and stored in MongoDB user record.
- **Phone number**: used for login/sign‑up and stored in the user profile.

### Identifiers
- **User ID**:
  - Clerk user ID (for Clerk-auth users)
  - MongoDB `_id` (for custom/JWT users)

### User Content
- **Messages / chat content**: stored in MongoDB `messages` collection (per booking).
- **Reviews**: stored in MongoDB `reviews` collection.

### Purchases / Transactions
- **Bookings / transaction history**:
  - booking records in MongoDB `bookings`
  - payment initiation/status via QPay (invoice/payment state, order identifiers)

### Other Data Types (linked)
- **Push notification tokens**:
  - stored on the user record (legacy `fcmToken` / `fcmTokens`, and/or `pushTokens` depending on code path)

## Data Not Linked to You
### Diagnostics
- **Crash logs / performance diagnostics**:
  - Not explicitly collected by a 3rd‑party crash SDK in the current repo.
  - Server logs may contain operational diagnostics.

## Data Collection Purpose (high level)
- **App functionality**: booking flows, messaging, notifications
- **Account management**: sign-in / user profile
- **Payment processing**: QPay invoice/payment status

## Data Deletion
- The app provides an in‑app **Delete account** action and a backend endpoint that deletes user data from MongoDB and revokes the Clerk account.
  - Endpoint: `DELETE /api/users/[id]/delete-account`

