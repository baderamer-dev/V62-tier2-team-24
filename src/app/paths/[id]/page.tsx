"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { LearningPath } from "@/types";
import { Clock3, Plus, Search, Sparkles } from "lucide-react";

export default function PathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const raw = useSyncExternalStore(
    subscribe,
    () =>
      sessionStorage.getItem(`learning-path:${id}`) ??
      localStorage.getItem(`learning-path:${id}`),
    () => null,
  );
  const path = parsePath(raw, id);

  if (!path)
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-8 text-center text-foreground">
        <h1 className="text-2xl font-bold">Learning path unavailable</h1>
        <p className="max-w-md text-muted-foreground">
          This path is saved in the browser session that generated it. Generate
          a new path to view its steps.
        </p>
        <Link
          href="/paths/new"
          className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
        >
          Generate a path
        </Link>
      </div>
    );

  const steps = path.steps;
  const completed = 0;
  const progress = steps.length
    ? Math.round((completed / steps.length) * 100)
    : 0;
  const totalWeeks = steps.reduce((sum, step) => sum + step.estimatedWeeks, 0);
  const savedPaths = [
    {
      title: path.goal,
      detail: `${path.skillLevel} · ${totalWeeks} weeks`,
      progress,
      active: true,
    },
  ];

  return (
    <div className="relative z-10 min-h-screen bg-background font-sans text-foreground transition-colors">
      <div className="flex min-h-[1100px]">
        <aside className="hidden w-[286px] shrink-0 border-r border-border bg-muted/30 px-3 py-6 transition-colors lg:block">
          <Link
            href="/paths/new"
            className="flex h-11 items-center justify-center gap-1 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-400"
          >
            <Plus className="size-4" /> New Path
          </Link>
          <div className="mt-6 flex h-9 items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-xs text-muted-foreground">
            <Search className="size-4" /> Search paths...
          </div>
          <div className="mt-2 rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-muted-foreground">
            Sort: Recently opened
          </div>
          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            Learning Paths
          </p>
          <div className="space-y-1">
            {savedPaths.map((path) => (
              <div
                key={path.title}
                className={`rounded-xl border px-3 py-3 ${path.active ? "border-emerald-500/25 bg-emerald-500/[.08]" : "border-transparent"}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`size-2 rounded-full ${path.active ? "bg-emerald-500" : "bg-muted-foreground"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-foreground">
                      {path.title}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {path.detail}
                    </p>
                  </div>
                  {path.progress != null && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      {path.progress}%
                    </span>
                  )}
                </div>
                <div className="mt-2 h-[2px] rounded-full bg-border">
                  <div
                    className="h-full bg-emerald-400"
                    style={{ width: `${path.progress ?? 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1" id="roadmap">
          <section className="border-b border-border px-5 pb-5 pt-6 md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-400">
                    {path.goal}
                  </span>
                  <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs capitalize text-cyan-700 dark:text-cyan-400">
                    {path.skillLevel}
                  </span>
                  <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs text-violet-700 dark:text-violet-400">
                    {totalWeeks} weeks estimated
                  </span>
                </div>
                <p className="mt-2 pl-3 text-xs text-muted-foreground">
                  {completed} of {steps.length} steps completed
                </p>
              </div>
            </div>
            <div className="mt-7 flex items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
          </section>
          <section className="mx-auto flex max-w-[780px] flex-col items-center px-5 pb-20 pt-16 md:px-8">
            <div className="relative w-full">
              <div className="absolute bottom-0 left-5 top-0 w-px bg-border md:left-1/2" />
              <div className="relative space-y-16 md:space-y-28">
                {steps.map((step, index) => (
                  <div
                    key={step.stepNumber}
                    className={`relative flex pl-16 md:pl-0 ${index % 2 ? "md:justify-end md:pl-[52%]" : "md:justify-start md:pr-[52%]"}`}
                  >
                    <article className="w-full max-w-[320px] rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          Step {step.stepNumber}
                        </span>
                        <span className="ml-auto grid size-6 place-items-center rounded-full border-2 border-muted-foreground/50" />
                      </div>
                      <h2 className="mt-4 text-base font-bold text-foreground">
                        {step.title}
                      </h2>
                      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                        {step.description}
                      </p>
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock3 className="size-3.5" /> Est:{" "}
                        {step.estimatedWeeks}{" "}
                        {step.estimatedWeeks === 1 ? "week" : "weeks"}
                      </p>
                    </article>
                    <span className="absolute left-0 top-6 z-10 grid size-10 place-items-center rounded-full border-2 border-border bg-background font-semibold text-muted-foreground md:left-1/2 md:-translate-x-1/2">
                      {step.stepNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/paths/new"
              className="mt-24 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-4 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
            >
              <Sparkles className="size-4" /> Generate a New Path
            </Link>
          </section>
        </main>
      </div>
    </div>
  );
}

function isLearningPath(value: unknown): value is LearningPath {
  if (!value || typeof value !== "object") return false;
  const path = value as Partial<LearningPath>;
  return (
    typeof path.id === "string" &&
    typeof path.goal === "string" &&
    typeof path.skillLevel === "string" &&
    Array.isArray(path.steps) &&
    path.steps.every(
      (step) =>
        typeof step.stepNumber === "number" &&
        typeof step.title === "string" &&
        typeof step.description === "string" &&
        typeof step.estimatedWeeks === "number",
    )
  );
}

function subscribe() {
  return () => {};
}

function parsePath(raw: string | null, id: string): LearningPath | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isLearningPath(value) && value.id === id ? value : null;
  } catch {
    return null;
  }
}
