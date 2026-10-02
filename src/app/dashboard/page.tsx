"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, Plus, Sparkles } from "lucide-react";
import type { InteractiveLearningPath } from "@/types";
import { fetchUserPaths } from "@/features/paths/api";

export default function DashboardPage() {
  const [paths, setPaths] = useState<InteractiveLearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchUserPaths();
        setPaths(data);
      } catch (err) {
        console.error("[dashboard] Failed to fetch paths:", err);
        setError("Could not load your paths. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-5 py-12 md:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Learning Paths</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All your generated roadmaps in one place.
            </p>
          </div>
          <Link
            href="/paths/new"
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
          >
            <Plus className="size-4" /> New Path
          </Link>
        </div>

        <div className="mt-10">
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              Loading your paths…
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && paths.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
              <Sparkles className="size-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                You haven&apos;t generated any paths yet.
              </p>
              <Link
                href="/paths/new"
                className="rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:brightness-110"
              >
                Generate your first path
              </Link>
            </div>
          )}

          {/* Path grid */}
          {!loading && !error && paths.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {paths.map((path) => {
                const completedCount = Object.values(
                  path.completedSteps ?? {},
                ).filter(Boolean).length;
                const progress = path.totalSteps
                  ? Math.round((completedCount / path.totalSteps) * 100)
                  : 0;
                const totalWeeks = path.steps.reduce(
                  (sum, s) => sum + s.estimatedWeeks,
                  0,
                );

                return (
                  <Link
                    key={path.id}
                    href={`/paths/${path.id}`}
                    className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-emerald-500/30 hover:bg-emerald-500/[.03]"
                  >
                    {/* Goal + skill badge */}
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        {path.goal}
                      </span>
                      <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] capitalize text-cyan-700 dark:text-cyan-400">
                        {path.skillLevel}
                      </span>
                    </div>

                    {/* Meta */}
                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {totalWeeks} weeks
                      </span>
                      <span>·</span>
                      <span>
                        {completedCount}/{path.totalSteps} steps done
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-right text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      {progress}%
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
