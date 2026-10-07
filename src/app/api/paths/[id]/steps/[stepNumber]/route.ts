import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/require-auth";
import { regenerateStep, AIServiceError } from "@/lib/ai-service";
import type { LearningPathStep } from "@/types";

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

// ── PUT /api/paths/[id]/steps/[stepNumber] ────────────────────────────────────
// Regenerates a single step using the AI and persists the result to Firestore.
// Returns the new step object.
export const PUT = requireAuth<{ id: string; stepNumber: string }>(
  async (_request, { params, auth }) => {
    const { id, stepNumber: stepNumberStr } = await params;
    const stepNumber = Number(stepNumberStr);

    if (!Number.isInteger(stepNumber) || stepNumber < 1) {
      return NextResponse.json(
        { error: "stepNumber must be a positive integer" },
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

      const data = doc.data()!;

      if (data.userId !== auth.userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const steps: LearningPathStep[] = data.steps ?? [];
      const stepIndex = steps.findIndex((s) => s.stepNumber === stepNumber);

      if (stepIndex === -1) {
        return NextResponse.json({ error: "Step not found" }, { status: 404 });
      }

      // Collect the titles of every step except the one being regenerated
      // so the AI avoids producing a duplicate topic.
      const otherStepTitles = steps
        .filter((s) => s.stepNumber !== stepNumber)
        .map((s) => s.title);

      const newStep = await regenerateStep({
        goal: data.goal as string,
        skillLevel: data.skillLevel as "beginner" | "intermediate" | "advanced",
        totalSteps: data.totalSteps as number,
        stepNumber,
        otherStepTitles,
      });

      // Replace just the target step in the array
      const updatedSteps = steps.map((s) =>
        s.stepNumber === stepNumber ? newStep : s,
      );

      await ref.update({
        steps: updatedSteps,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json(newStep, { status: 200 });
    } catch (err) {
      if (err instanceof AIServiceError) {
        return NextResponse.json(
          { error: err.message, code: err.aiError.code },
          { status: 502 },
        );
      }

      console.error(
        `[PUT /api/paths/${id}/steps/${stepNumber}] error:`,
        err,
      );
      return NextResponse.json(
        { error: "Failed to regenerate step" },
        { status: 500 },
      );
    }
  },
);
