import type { CreatePathValues } from "./schema";
import type { GeneratePathResponse, LearningPath, InteractiveLearningPath } from "@/types";
import { authHeaders, getToken } from "@/features/auth/api";

export class GeneratePathError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "GeneratePathError";
  }
}

export class PathApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "PathApiError";
  }
}

// ── Generate ──────────────────────────────────────────────────────────────────
// Always unauthenticated — both guests and logged-in users can generate.

export async function generatePath(
  input: CreatePathValues,
): Promise<GeneratePathResponse> {
  const response = await fetch("/api/generate-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new GeneratePathError(
      "Could not generate your learning path. Please try again.",
      response.status,
    );
  }

  return response.json() as Promise<GeneratePathResponse>;
}

// ── Save path ─────────────────────────────────────────────────────────────────
// Only attempts the Firestore save when the user is logged in.
// Guests are silently skipped — their path lives in browser storage only.

export async function savePath(path: LearningPath): Promise<void> {
  if (!getToken()) return; // guest — nothing to do

  const response = await fetch("/api/paths", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ path }),
  });

  if (!response.ok) {
    throw new PathApiError("Could not save your learning path.", response.status);
  }
}

// ── Fetch a single path ───────────────────────────────────────────────────────
// Logged-in users get the path from Firestore (includes server-side completedSteps).
// Guests get null — the caller falls back to browser storage.

export async function fetchPath(id: string): Promise<InteractiveLearningPath | null> {
  if (!getToken()) return null; // guest — let the page use browser storage

  const response = await fetch(`/api/paths/${id}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new PathApiError("Could not load the learning path.", response.status);
  }

  const data = await response.json() as InteractiveLearningPath & {
    completedSteps?: Record<string, boolean>;
  };

  const completedSteps: Record<number, boolean> = {};
  for (const [key, val] of Object.entries(data.completedSteps ?? {})) {
    completedSteps[Number(key)] = val;
  }

  return { ...data, completedSteps };
}

// ── Fetch all paths for the authenticated user ────────────────────────────────
// Returns an empty array for guests instead of hitting the API.

export async function fetchUserPaths(): Promise<InteractiveLearningPath[]> {
  if (!getToken()) return [];

  const response = await fetch("/api/paths", {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new PathApiError("Could not load your paths.", response.status);
  }

  return response.json() as Promise<InteractiveLearningPath[]>;
}

// ── Toggle a step ─────────────────────────────────────────────────────────────
// Logged-in: persists to Firestore and returns server progress.
// Guest: returns null — the caller handles local-only state updates.

export interface ToggleStepResult {
  completedSteps: Record<number, boolean>;
  completedCount: number;
  totalSteps: number;
  progress: number;
}

export async function toggleStep(
  pathId: string,
  stepNumber: number,
  completed: boolean,
): Promise<ToggleStepResult | null> {
  if (!getToken()) return null; // guest — optimistic update is already applied by the caller

  const response = await fetch(`/api/paths/${pathId}/steps/${stepNumber}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ completed }),
  });

  if (!response.ok) {
    throw new PathApiError("Could not update step.", response.status);
  }

  const data = await response.json() as {
    completedSteps: Record<string, boolean>;
    completedCount: number;
    totalSteps: number;
    progress: number;
  };

  const completedSteps: Record<number, boolean> = {};
  for (const [key, val] of Object.entries(data.completedSteps)) {
    completedSteps[Number(key)] = val;
  }

  return { ...data, completedSteps };
}
