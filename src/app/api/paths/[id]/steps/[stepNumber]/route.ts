import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/require-auth";

// ── PATCH /api/paths/[id]/steps/[stepNumber] ─────────────────────────────────
// Body: { completed: boolean }
// userId comes from the JWT — no need to send it in the body.
export const PATCH = requireAuth<{ id: string; stepNumber: string }>(
  async (request, { params, auth }) => {
    const { id, stepNumber } = await params;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    const { completed } = body as { completed: boolean };

    if (typeof completed !== "boolean") {
      return NextResponse.json(
        { error: "completed must be a boolean" },
        { status: 400 },
      );
    }

    try {
      const db = getAdminFirestore();
      const ref = db.collection("paths").doc(id);
      const doc = await ref.get();

      if (!doc.exists) {
        return NextResponse.json({ error: "Path not found" }, { status: 404 });
      }

      // Guard: only the owner can modify their path
      if (doc.data()!.userId !== auth.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await ref.update({
        [`completedSteps.${stepNumber}`]: completed,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Re-read for fresh progress
      const updated = (await ref.get()).data()!;
      const completedSteps: Record<string, boolean> =
        updated.completedSteps ?? {};
      const totalSteps: number = updated.totalSteps ?? 0;
      const completedCount = Object.values(completedSteps).filter(Boolean).length;
      const progress =
        totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

      return NextResponse.json(
        { completedSteps, completedCount, totalSteps, progress },
        { status: 200 },
      );
    } catch (err) {
      console.error(
        `[PATCH /api/paths/${id}/steps/${stepNumber}] Firestore error:`,
        err,
      );
      return NextResponse.json(
        { error: "Failed to update step" },
        { status: 500 },
      );
    }
  },
);
