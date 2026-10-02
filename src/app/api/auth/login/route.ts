import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { comparePassword, signToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  // ── Parse & validate ───────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;

  try {
    const db = getAdminFirestore();

    // ── Look up user by email ──────────────────────────────────────────────
    const snap = await db
      .collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    // Use a generic message to avoid leaking whether the email exists
    const INVALID_MSG = "Invalid email or password.";

    if (snap.empty) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: INVALID_MSG },
        { status: 401 },
      );
    }

    const userDoc = snap.docs[0].data();

    // ── Verify password ────────────────────────────────────────────────────
    const passwordMatch = await comparePassword(password, userDoc.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "INVALID_CREDENTIALS", message: INVALID_MSG },
        { status: 401 },
      );
    }

    // ── Issue JWT ──────────────────────────────────────────────────────────
    const token = await signToken({
      userId: userDoc.userId,
      email: userDoc.email,
      username: userDoc.displayUsername,
    });

    return NextResponse.json(
      {
        token,
        user: {
          userId: userDoc.userId,
          username: userDoc.displayUsername,
          email: userDoc.email,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[POST /api/auth/login] Error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
