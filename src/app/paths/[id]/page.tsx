"use client";

import { useEffect, useState, useCallback } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TourHint, useResultTour } from "./result-tour";
import {
  CheckCircle2,
  Circle,
  Clock3,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Info,
  Sparkles,
  X,
} from "lucide-react";
import type {
  InteractiveLearningPath,
  InteractiveLearningPathStep,
} from "@/types";
import {
  fetchPath,
  fetchUserPaths,
  regenerateStep,
  toggleStep,
} from "@/features/paths/api";
import { getToken } from "@/features/auth/api";

export default function PathDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [path, setPath] = useState<InteractiveLearningPath | null>(null);
  const [allPaths, setAllPaths] = useState<InteractiveLearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [pathSearch, setPathSearch] = useState("");
  const tour = useResultTour();
  // Track which steps are currently being toggled to prevent double-clicks
  const [togglingSteps, setTogglingSteps] = useState<Set<number>>(new Set());
  // Track which steps are being regenerated
  const [regeneratingSteps, setRegeneratingSteps] = useState<Set<number>>(
    new Set(),
  );

  // ── Load path ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Returns null for guests — falls through to browser storage below
        const data = await fetchPath(id);
        if (data) {
          setPath(data);
          setLoading(false);
          return;
        }
      } catch {
        // Authenticated fetch failed — still fall back to browser storage
      }

      // Guest or Firestore unavailable — read from browser storage
      const raw =
        sessionStorage.getItem(`learning-path:${id}`) ??
        localStorage.getItem(`learning-path:${id}`);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as InteractiveLearningPath;
          if (!parsed.completedSteps) {
            parsed.completedSteps = Object.fromEntries(
              parsed.steps.map((s) => [s.stepNumber, false]),
            );
          }
          setPath(parsed);
        } catch {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // ── Load all user paths for the sidebar ───────────────────────────────────
  useEffect(() => {
    fetchUserPaths()
      .then(setAllPaths)
      .catch(() => {
        // Guests or fetch error — sidebar will show only the current path
      });
  }, []);

  // ── Detect auth state ──────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoggedIn(!!getToken());
  }, []);

  // ── Toggle step ────────────────────────────────────────────────────────────
  const handleToggleStep = useCallback(
    async (stepNumber: number, currentCompleted: boolean) => {
      if (!path) return;
      if (togglingSteps.has(stepNumber)) return;

      const newCompleted = !currentCompleted;

      // Optimistic update
      setPath((prev) => {
        if (!prev) return prev;
        const updatedCompletedSteps = {
          ...prev.completedSteps,
          [stepNumber]: newCompleted,
        };
        return { ...prev, completedSteps: updatedCompletedSteps };
      });

      setTogglingSteps((prev) => new Set(prev).add(stepNumber));

      try {
        const result = await toggleStep(path.id, stepNumber, newCompleted);
        // Sync server response when logged in (source of truth).
        // For guests, result is null and the optimistic update already applied above.
        if (result) {
          setPath((prev) => {
            if (!prev) return prev;
            return { ...prev, completedSteps: result.completedSteps };
          });
        }
      } catch (err) {
        console.error("[path detail] Failed to toggle step:", err);
        // Revert optimistic update on error
        setPath((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            completedSteps: {
              ...prev.completedSteps,
              [stepNumber]: currentCompleted,
            },
          };
        });
      } finally {
        setTogglingSteps((prev) => {
          const next = new Set(prev);
          next.delete(stepNumber);
          return next;
        });
      }
    },
    [path, togglingSteps],
  );

  // ── Regenerate step ────────────────────────────────────────────────────────
  const handleRegenerateStep = useCallback(
    async (stepNumber: number) => {
      if (!path || !isLoggedIn) return;
      if (regeneratingSteps.has(stepNumber)) return;

      setRegeneratingSteps((prev) => new Set(prev).add(stepNumber));

      try {
        const newStep = await regenerateStep(path.id, stepNumber);

        // Splice the regenerated step back in, preserving completed state
        setPath((prev) => {
          if (!prev) return prev;
          const updatedSteps = prev.steps.map((s) =>
            s.stepNumber === stepNumber
              ? ({
                  ...newStep,
                  completed: s.completed,
                } as InteractiveLearningPathStep)
              : s,
          );
          return { ...prev, steps: updatedSteps };
        });
      } catch (err) {
        console.error("[path detail] Failed to regenerate step:", err);
      } finally {
        setRegeneratingSteps((prev) => {
          const next = new Set(prev);
          next.delete(stepNumber);
          return next;
        });
      }
    },
    [path, isLoggedIn, regeneratingSteps],
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-muted-foreground">Loading your learning path…</p>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !path) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-background p-8 text-center text-foreground">
        <h1 className="text-2xl font-bold">Learning path unavailable</h1>
        <p className="max-w-md text-muted-foreground">
          This path could not be found. Generate a new path to get started.
        </p>
        <Link
          href="/paths/new"
          className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground"
        >
          Generate a path
        </Link>
      </div>
    );
  }

  // ── Derived values ─────────────────────────────────────────────────────────
  const steps = path.steps;
  const completedSteps = path.completedSteps ?? {};
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progress = steps.length
    ? Math.round((completedCount / steps.length) * 100)
    : 0;
  const totalWeeks = steps.reduce((sum, step) => sum + step.estimatedWeeks, 0);

  // ── Sidebar paths list ─────────────────────────────────────────────────────
  // Show all fetched paths; fall back to just the current path for guests.
  const sidebarPaths = allPaths.length > 0 ? allPaths : [path];
  const query = pathSearch.trim().toLocaleLowerCase();
  const filteredSidebarPaths = query
    ? sidebarPaths.filter((sidebarPath) => {
        const searchableText = [
          sidebarPath.goal,
          sidebarPath.skillLevel,
          ...sidebarPath.steps.flatMap((step) => [
            step.title,
            step.description,
          ]),
        ]
          .join(" ")
          .toLocaleLowerCase();

        return searchableText.includes(query);
      })
    : sidebarPaths;

  const handleActivePathClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById("roadmap")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="relative z-10 flex flex-1 flex-col overflow-hidden bg-background font-sans text-foreground transition-colors">
      <div className="dashboard-wash" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        {/* ── Sidebar ────────────────────────────────────────────────────── */}
        <aside className="hidden h-full w-[286px] shrink-0 overflow-hidden border-r border-border bg-muted/30 px-3 py-6 transition-colors lg:block">
          <Link
            href="/paths/new"
            className="flex h-11 items-center justify-center gap-1 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-sm font-semibold text-emerald-700 dark:text-emerald-400"
          >
            <Plus className="size-4" /> New Path
          </Link>
          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={pathSearch}
              onChange={(event) => setPathSearch(event.target.value)}
              placeholder="Search paths..."
              aria-label="Search learning paths"
              className="h-9 w-full rounded-lg border border-border bg-background/60 pl-9 pr-9 text-xs text-foreground outline-none transition focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/15"
            />
            {pathSearch && (
              <button
                type="button"
                onClick={() => setPathSearch("")}
                aria-label="Clear path search"
                className="absolute right-2 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
            <TourHint
              id={0}
              step={tour.step}
              text="Search your paths by goal, level, or step."
              isLast={tour.isLast}
              onAdvance={tour.advance}
              className="left-0 top-full mt-2"
            />
          </div>
          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">
            Learning Paths
          </p>
          <div className="space-y-1">
            {filteredSidebarPaths.map((p, pathIndex) => {
              if (!p) return null;
              const pCompleted = p.completedSteps ?? {};
              const pCompletedCount =
                Object.values(pCompleted).filter(Boolean).length;
              const pTotalWeeks = p.steps.reduce(
                (sum, s) => sum + s.estimatedWeeks,
                0,
              );
              const pProgress = p.steps.length
                ? Math.round((pCompletedCount / p.steps.length) * 100)
                : 0;
              const isActive = p.id === id;

              return (
                <div key={p.id} className="relative">
                  <Link
                    href={`/paths/${p.id}#roadmap`}
                    onClick={isActive ? handleActivePathClick : undefined}
                    className={`block rounded-xl border px-3 py-3 transition-colors ${
                      isActive
                        ? "border-emerald-500/25 bg-emerald-500/[.08]"
                        : "border-transparent hover:border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`size-2 shrink-0 rounded-full ${
                          isActive ? "bg-emerald-500" : "bg-muted-foreground/40"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] text-foreground">
                          {p.goal}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {p.skillLevel} · {pTotalWeeks} weeks
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] ${
                          isActive
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {pProgress}%
                      </span>
                    </div>
                    <div className="mt-2 h-[2px] rounded-full bg-border">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isActive ? "bg-emerald-400" : "bg-muted-foreground/30"
                        }`}
                        style={{ width: `${pProgress}%` }}
                      />
                    </div>
                  </Link>
                  {pathIndex === 0 && (
                    <TourHint
                      id={1}
                      step={tour.step}
                      text="Each path keeps its own progress here."
                      isLast={tour.isLast}
                      onAdvance={tour.advance}
                      className="left-0 top-full mt-2"
                    />
                  )}
                </div>
              );
            })}
            {filteredSidebarPaths.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                No learning paths match “{pathSearch.trim()}”.
              </p>
            )}
          </div>
        </aside>

        {/* ── Main ───────────────────────────────────────────────────────── */}
        <main
          className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
          id="roadmap"
        >
          {/* Header */}
          <section className="shrink-0 border-b border-border px-5 pb-5 pt-6 md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="w-full">
                <div className="flex w-full flex-wrap items-center gap-2">
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-700 dark:text-emerald-400">
                    {path.goal}
                  </span>
                  <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs capitalize text-cyan-700 dark:text-cyan-400">
                    {path.skillLevel}
                  </span>
                  <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs text-violet-700 dark:text-violet-400">
                    {totalWeeks} weeks estimated
                  </span>
                  <button
                    type="button"
                    onClick={tour.restart}
                    aria-label="Show page tips"
                    className="info-wave ml-auto grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Info className="size-4" />
                  </button>
                </div>
                <p className="mt-2 pl-3 text-xs text-muted-foreground">
                  {completedCount} of {steps.length} steps completed
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="relative mt-7 flex items-center gap-4">
              <TourHint
                id={2}
                step={tour.step}
                text="This bar fills as you complete steps."
                isLast={tour.isLast}
                onAdvance={tour.advance}
                className="right-0 top-full mt-2"
              />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
          </section>

          {/* Roadmap */}
          <section className="min-h-0 w-full flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-[780px] flex-col items-center px-5 pb-20 pt-16 md:px-8">
              <div className="relative w-full">
                <div className="absolute bottom-0 left-5 top-0 w-px bg-border md:left-1/2" />
                <div className="relative space-y-16 md:space-y-28">
                  {steps.map((step, index) => {
                    const isCompleted = !!completedSteps[step.stepNumber];
                    const isToggling = togglingSteps.has(step.stepNumber);
                    const isRegenerating = regeneratingSteps.has(
                      step.stepNumber,
                    );

                    return (
                      <div
                        key={step.stepNumber}
                        className={`relative flex pl-16 md:pl-0 ${
                          index % 2
                            ? "md:justify-end md:pl-[52%]"
                            : "md:justify-start md:pr-[52%]"
                        }`}
                      >
                        <article
                          tabIndex={0}
                          className={`group relative w-full max-w-[320px] rounded-2xl border bg-card p-6 text-card-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            isRegenerating
                              ? "border-violet-500/30"
                              : isCompleted
                                ? "border-emerald-500/30 bg-emerald-500/[.04]"
                                : "border-border"
                          }`}
                        >
                          {/* ── Regenerating skeleton overlay ── */}
                          {isRegenerating ? (
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  Step {step.stepNumber}
                                </span>
                                <span className="flex items-center gap-1.5 text-[11px] text-violet-500 dark:text-violet-400">
                                  <RefreshCw className="size-3 animate-spin" />
                                  Regenerating…
                                </span>
                              </div>
                              {/* Animated skeleton bars */}
                              <div className="mt-2 space-y-2">
                                <div className="h-4 w-3/4 animate-pulse rounded-md bg-muted" />
                                <div className="h-3 w-full animate-pulse rounded-md bg-muted" />
                                <div className="h-3 w-5/6 animate-pulse rounded-md bg-muted" />
                                <div className="h-3 w-4/6 animate-pulse rounded-md bg-muted" />
                              </div>
                              <div className="mt-3 space-y-2">
                                <div className="h-2 w-1/3 animate-pulse rounded-md bg-muted" />
                                <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
                                <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  Step {step.stepNumber}
                                </span>
                                {/* Regenerate button — logged-in users only */}
                                {isLoggedIn && (
                                  <button
                                    type="button"
                                    aria-label={`Regenerate step ${step.stepNumber}`}
                                    disabled={isToggling || isRegenerating}
                                    onClick={() =>
                                      handleRegenerateStep(step.stepNumber)
                                    }
                                    className="rounded-full p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-violet-500 disabled:opacity-40"
                                  >
                                    <RefreshCw className="size-3.5" />
                                  </button>
                                )}
                                {/* Toggle button */}
                                <button
                                  type="button"
                                  aria-label={
                                    isCompleted
                                      ? `Mark step ${step.stepNumber} as incomplete`
                                      : `Mark step ${step.stepNumber} as complete`
                                  }
                                  disabled={isToggling}
                                  onClick={() =>
                                    handleToggleStep(
                                      step.stepNumber,
                                      isCompleted,
                                    )
                                  }
                                  className="ml-auto grid size-6 place-items-center rounded-full transition-opacity disabled:opacity-40"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="size-5 text-emerald-500" />
                                  ) : (
                                    <Circle className="size-5 text-muted-foreground/50" />
                                  )}
                                </button>
                              </div>
                              <h2
                                className={`mt-4 text-base font-bold transition-colors ${
                                  isCompleted
                                    ? "text-muted-foreground line-through"
                                    : "text-foreground"
                                }`}
                              >
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
                              <p className="mt-4 text-[11px] font-medium text-muted-foreground">
                                Hover or focus to view resources
                              </p>
                              <div className="grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity] duration-300 group-hover:grid-rows-[1fr] group-hover:opacity-100 group-focus-within:grid-rows-[1fr] group-focus-within:opacity-100">
                                <div className="overflow-hidden">
                                  <div className="mt-4 border-t border-border pt-4">
                                    <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                                      Recommended resources
                                    </h3>
                                    {step.resources?.length ? (
                                      <ul className="mt-3 space-y-2">
                                        {step.resources.map((resource) => (
                                          <li
                                            key={`${resource.url}-${resource.title}`}
                                          >
                                            <a
                                              href={resource.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="block rounded-lg border border-border bg-muted/40 p-3 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            >
                                              <span className="flex items-start gap-2">
                                                <span className="min-w-0 flex-1">
                                                  <span className="block text-xs font-semibold text-foreground">
                                                    {resource.title}
                                                  </span>
                                                  <span className="mt-1 block text-[11px] leading-relaxed text-muted-foreground">
                                                    {resource.description}
                                                  </span>
                                                </span>
                                                <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                                              </span>
                                              <span className="mt-2 flex gap-2 text-[10px] capitalize text-muted-foreground">
                                                <span>{resource.type}</span>
                                                <span aria-hidden="true">
                                                  ·
                                                </span>
                                                <span>
                                                  {resource.free
                                                    ? "Free"
                                                    : "Paid"}
                                                </span>
                                              </span>
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <p className="mt-2 text-xs text-muted-foreground">
                                        No resources were returned for this
                                        step.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </article>

                        {/* Step number node */}
                        <span
                          className={`absolute left-0 top-6 z-10 grid size-10 place-items-center rounded-full border-2 font-semibold transition-colors md:left-1/2 md:-translate-x-1/2 ${
                            isRegenerating
                              ? "border-violet-500 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                              : isCompleted
                                ? "border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-border bg-background text-muted-foreground"
                          }`}
                        >
                          {isRegenerating ? (
                            <RefreshCw className="size-4 animate-spin" />
                          ) : (
                            step.stepNumber
                          )}
                        </span>
                        {index === 0 && (
                          <TourHint
                            id={3}
                            step={tour.step}
                            text="Hover a step to open its links."
                            isLast={tour.isLast}
                            onAdvance={tour.advance}
                            className="left-16 top-full mt-3 md:left-0"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
