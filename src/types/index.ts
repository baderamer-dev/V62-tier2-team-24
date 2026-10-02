export const SKILL_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

export const WEEKLY_HOURS = ["2-5", "5-10", "10-20", "20+"] as const;
export type WeeklyHours = (typeof WEEKLY_HOURS)[number];

export type CreatePathInput = {
  careerGoal: string;
  skillLevel: SkillLevel;
  background?: string;
  weeklyHours: WeeklyHours;
};

// ── AI service types (mirrors data-flow doc) ────────────────────────────────

export interface LearningPathParams {
  goal: string;
  skillLevel: SkillLevel;
  background?: string;
  weeklyHours: WeeklyHours;
}

export interface AIError {
  code: "AI_TIMEOUT" | "AI_REQUEST_FAILED" | "INVALID_JSON" | "INVALID_SCHEMA";
  message: string;
}

export interface LearningPathStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedWeeks: number;
}

export interface LearningPath {
  id: string;
  goal: string;
  skillLevel: SkillLevel;
  totalSteps: number;
  steps: LearningPathStep[];
  createdAt: string;
  /** Anonymous user ID generated client-side and stored in localStorage */
  userId?: string;
}

export interface InteractiveLearningPathStep extends LearningPathStep {
  completed: boolean;
}

export interface InteractiveLearningPath extends Omit<LearningPath, "steps"> {
  steps: InteractiveLearningPathStep[];
  /**
   * Map of stepNumber → completed.
   * Stored as a flat object in Firestore so individual steps can be toggled
   * without rewriting the whole array.
   */
  completedSteps: Record<number, boolean>;
}

// ── API response ─────────────────────────────────────────────────────────────

export type GeneratePathResponse = LearningPath;
