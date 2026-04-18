import { NextResponse } from "next/server";

/**
 * Master-password bypass was removed for store / security compliance (see ARCHITECTURE.md).
 * This endpoint remains only so old clients receive a clear response instead of 404.
 */
export function POST() {
  return NextResponse.json(
    {
      message:
        "This login method has been disabled. Use standard sign-in or contact support.",
    },
    { status: 410 },
  );
}
