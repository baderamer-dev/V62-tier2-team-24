import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";

/**
 * GET /api/auth/me
 * Returns the authenticated user's profile from the JWT payload.
 * No Firestore round-trip needed — the JWT is the source of truth for the session.
 */
export const GET = requireAuth(async (_request, { auth }) => {
  return NextResponse.json(
    {
      userId: auth.userId,
      username: auth.username,
      email: auth.email,
    },
    { status: 200 },
  );
});
