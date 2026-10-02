import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/require-auth";
import type { LearningPath } from "@/types";

// ── POST /api/paths ──────────────────────────────────────────────────────────
// Saves the generated path to Firestore.
// userId comes from the verified JWT — the body no longer needs to supply it.
export const POST = requireAuth(async (request, { auth }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("path" in body)) {
    return NextResponse.json(
      { error: "Request body must contain { path }" },
      { status: 400 },
    );
  }

  const { path } = body as { path: LearningPath };

  if (!path?.id || typeof path.id !== "string") {
    return NextResponse.json(
      { error: "path.id is required and must be a string" },
      { status: 400 },
    );
  }

  try {
    const db = getAdminFirestore();

    const doc = {
      ...path,
      // Always stamp with the authenticated user's ID — never trust client-supplied userId
      userId: auth.userId,
      completedSteps: Object.fromEntries(
        path.steps.map((s) => [String(s.stepNumber), false]),
      ),
    };

    await db.collection("paths").doc(path.id).set(doc);

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("[POST /api/paths] Firestore error:", err);
    return NextResponse.json({ error: "Failed to save path" }, { status: 500 });
  }
});

// ── GET /api/paths ───────────────────────────────────────────────────────────
// Returns all paths belonging to the authenticated user, newest first.
// The userId comes from the JWT — no query param needed.
export const GET = requireAuth(async (request, { auth }) => {
  try {
    const db = getAdminFirestore();
    const snapshot = await db
      .collection("paths")
      .where("userId", "==", auth.userId)
      .get();

    // Sort newest first in application code — avoids needing a composite Firestore index
    const paths = snapshot.docs
      .map((d) => d.data())
      .sort((a, b) => {
        const tA = new Date(a.createdAt as string).getTime();
        const tB = new Date(b.createdAt as string).getTime();
        return tB - tA;
      });

    return NextResponse.json(paths, { status: 200 });
  } catch (err) {
    console.error("[GET /api/paths] Firestore error:", err);
    return NextResponse.json(
      { error: "Failed to fetch paths" },
      { status: 500 },
    );
  }
});
