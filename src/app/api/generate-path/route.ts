import { NextResponse } from "next/server";
import { createPathSchema } from "@/features/paths/schema";
import { generateLearningPath, AIServiceError } from "@/lib/ai-service";
import type { LearningPathParams } from "@/types";

export async function POST(request: Request) {
  // ── Validate input ──────────────────────────────────────────────────────────
  const body = await request.json();
  const parsed = createPathSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { careerGoal, skillLevel, background, weeklyHours } = parsed.data;

  // ── Map form values → LearningPathParams ────────────────────────────────────
  const params: LearningPathParams = {
    goal: careerGoal,
    skillLevel,
    background,
    weeklyHours,
  };

  // ── Call the AI service ─────────────────────────────────────────────────────
  try {
    const learningPath = await generateLearningPath(params);

    // console.log(
    //   "[generate-path] LearningPath generated:",
    //   JSON.stringify(learningPath, null, 2),
    // );

    return NextResponse.json(learningPath, { status: 200 });
  } catch (err) {
    if (err instanceof AIServiceError) {
      const { code, message } = err.aiError;
      console.error(`[generate-path] AIServiceError [${code}]:`, message);

      const status =
        code === "AI_REQUEST_FAILED" || code === "AI_TIMEOUT" ? 502 : 500;

      return NextResponse.json({ error: code, message }, { status });
    }

    console.error("[generate-path] Unexpected error:", err);
    return NextResponse.json(
      { error: "INTERNAL_ERROR", message: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
