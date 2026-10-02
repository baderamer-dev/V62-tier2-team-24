import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { hashPassword, signToken } from "@/lib/auth";

const signupSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username must be under 32 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  // ── Parse & validate ───────────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { username, email, password } = parsed.data;
  // Always generate a fresh server-side userId — never trust the client-supplied one.
  // This guarantees every account gets its own unique ID regardless of what's in
  // the browser's localStorage (fixes the overwrite bug when multiple accounts
  // are created from the same browser).
  const userId = `user_${crypto.randomUUID()}`;

  try {
    const db = getAdminFirestore();

    // ── Check email uniqueness ─────────────────────────────────────────────
    const emailSnap = await db
      .collection("users")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (!emailSnap.empty) {
      return NextResponse.json(
        { error: "EMAIL_TAKEN", message: "An account with this email already exists." },
        { status: 409 },
      );
    }

    // ── Check username uniqueness ──────────────────────────────────────────
    const usernameSnap = await db
      .collection("users")
      .where("username", "==", username.toLowerCase())
      .limit(1)
      .get();

    if (!usernameSnap.empty) {
      return NextResponse.json(
        { error: "USERNAME_TAKEN", message: "This username is already taken." },
        { status: 409 },
      );
    }

    // ── Hash password & persist user ───────────────────────────────────────
    const passwordHash = await hashPassword(password);

    const userDoc = {
      userId,
      username: username.toLowerCase(),
      displayUsername: username, // preserve original casing for display
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    // Use userId as the Firestore document ID so it matches path ownership
    await db.collection("users").doc(userId).set(userDoc);

    // ── Issue JWT ──────────────────────────────────────────────────────────
    const token = await signToken({
      userId,
      email: userDoc.email,
      username: userDoc.displayUsername,
    });

    return NextResponse.json(
      {
        token,
        user: {
          userId,
          username: userDoc.displayUsername,
          email: userDoc.email,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/auth/signup] Error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
