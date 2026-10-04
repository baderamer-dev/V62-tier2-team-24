import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import type { Schema } from "@google/generative-ai";
import { z } from "zod";
import type { LearningPathParams, LearningPath, AIError } from "@/types";

// ── Zod schema for validating the AI response ────────────────────────────────

const resourceSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  type: z.enum([
    "course",
    "article",
    "video",
    "documentation",
    "book",
    "other",
  ]),
  free: z.boolean(),
  description: z.string().min(1),
});

const learningPathStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedWeeks: z.number().int().positive(),
  resources: z.array(resourceSchema).min(1),
});

const learningPathSchema = z.object({
  goal: z.string().min(1),
  skillLevel: z.enum(["beginner", "intermediate", "advanced"]),
  totalSteps: z.number().int().positive(),
  steps: z.array(learningPathStepSchema).min(1),
});

// ── Gemini response schema (tells the model the exact shape to return) ────────

const geminiResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    goal: { type: SchemaType.STRING },
    skillLevel: {
      type: SchemaType.STRING,
      format: "enum" as const,
      enum: ["beginner", "intermediate", "advanced"],
    },
    totalSteps: { type: SchemaType.INTEGER },
    steps: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          stepNumber: { type: SchemaType.INTEGER },
          title: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          estimatedWeeks: { type: SchemaType.INTEGER },
          resources: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                url: { type: SchemaType.STRING },
                type: {
                  type: SchemaType.STRING,
                  format: "enum" as const,
                  enum: [
                    "course",
                    "article",
                    "video",
                    "documentation",
                    "book",
                    "other",
                  ],
                },
                free: { type: SchemaType.BOOLEAN },
                description: { type: SchemaType.STRING },
              },
              required: ["title", "url", "type", "free", "description"],
            },
          },
        },
        required: [
          "stepNumber",
          "title",
          "description",
          "estimatedWeeks",
          "resources",
        ],
      },
    },
  },
  required: ["goal", "skillLevel", "totalSteps", "steps"],
};

// ── Prompt builder ────────────────────────────────────────────────────────────

function buildSystemInstruction(): string {
  return `You are an expert learning path designer. Your job is to create structured, \
actionable learning roadmaps tailored to the user's goal, skill level, and available time. \
Always return a realistic, step-by-step path with clear milestones. \
Each step should build on the previous one and have a concrete, achievable outcome.`;
}

function buildUserMessage(params: LearningPathParams): string {
  const hoursMap: Record<string, string> = {
    "2-5": "2 to 5 hours",
    "5-10": "5 to 10 hours",
    "10-20": "10 to 20 hours",
    "20+": "more than 20 hours",
  };

  const lines = [
    `Create a personalized learning path for the following profile:`,
    ``,
    `Goal: ${params.goal}`,
    `Current skill level: ${params.skillLevel}`,
    `Available study time: ${hoursMap[params.weeklyHours]} per week`,
  ];

  if (params.background) {
    lines.push(`Background & experience: ${params.background}`);
  }

  lines.push(
    ``,
    `Generate a clear, sequential learning path with 5 to 10 steps.`,
    `Each step must have:`,
    `- stepNumber: sequential integer starting at 1`,
    `- title: a concise step title`,
    `- description: a detailed description of what to learn and do in this step`,
    `- estimatedWeeks: a realistic integer number of weeks`,
    `- resources: an array of 2 to 4 specific, real resources (courses, articles, videos, documentation, or books) relevant to this step.`,
    `  Each resource must include:`,
    `  - title: the exact name of the resource`,
    `  - url: a real, publicly accessible URL`,
    `  - type: one of "course", "article", "video", "documentation", "book", or "other"`,
    `  - free: true if the resource is free to access, false if paid`,
    `  - description: one sentence explaining what this resource covers and why it is useful for this step`,
    `  Mix free and paid resources where appropriate. Prefer well-known, high-quality sources such as MDN, freeCodeCamp, Coursera, Udemy, official documentation, YouTube, or reputable blogs.`,
    `The goal and skillLevel fields in the response must exactly match the input values provided above.`,
  );

  return lines.join("\n");
}

// ── Main service function ─────────────────────────────────────────────────────

export class AIServiceError extends Error {
  public readonly aiError: AIError;

  constructor(aiError: AIError) {
    super(aiError.message);
    this.name = "AIServiceError";
    this.aiError = aiError;
  }
}

export async function generateLearningPath(
  params: LearningPathParams,
): Promise<LearningPath> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AIServiceError({
      code: "AI_REQUEST_FAILED",
      message: "GEMINI_API_KEY is not configured.",
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    systemInstruction: buildSystemInstruction(),
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: geminiResponseSchema,
    },
  });

  // ── Call the API ────────────────────────────────────────────────────────────
  let rawText: string;
  try {
    const result = await model.generateContent(buildUserMessage(params));
    rawText = result.response.text();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error from Gemini API";
    throw new AIServiceError({ code: "AI_REQUEST_FAILED", message });
  }

  // ── Parse JSON ──────────────────────────────────────────────────────────────
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new AIServiceError({
      code: "INVALID_JSON",
      message: `Gemini returned non-JSON content: ${rawText.slice(0, 200)}`,
    });
  }

  // ── Validate schema ─────────────────────────────────────────────────────────
  const validated = learningPathSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AIServiceError({
      code: "INVALID_SCHEMA",
      message: `AI response did not match expected schema: ${JSON.stringify(validated.error.flatten())}`,
    });
  }

  // ── Assemble final LearningPath with server-generated id & timestamp ─────────
  const learningPath: LearningPath = {
    id: `path_${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    ...validated.data,
  };

  return learningPath;
}
