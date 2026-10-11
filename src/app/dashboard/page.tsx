"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, Plus } from "lucide-react";
import type { InteractiveLearningPath } from "@/types";
import { fetchUserPaths } from "@/features/paths/api";
import { Button } from "@/components/ui/button";
import { DashboardEmptyState } from "./empty-state";

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
    <div className="bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              My Learning Paths
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              All your generated roadmaps in one place.
            </p>
          </div>
          {!loading && !error && paths.length > 0 && (
            <Link href="/paths/new" className="hidden sm:block">
              <Button className="h-9">
                <Plus /> New path
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-10">
          {loading && (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              Loading your paths…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && paths.length === 0 && <DashboardEmptyState />}

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
                    className="group rounded-2xl border border-border/50 bg-card/50 p-5 shadow-sm backdrop-blur transition hover:border-border hover:bg-card/70"
                  >
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium">
                        {path.goal}
                      </span>
                      <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
                        {path.skillLevel}
                      </span>
                    </div>

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

                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-right text-[11px] font-semibold">
                      {progress}%
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        {!loading && !error && paths.length > 0 && (
          <Link href="/paths/new" className="mt-8 block sm:hidden">
            <Button className="h-11 w-full">
              <Plus /> New path
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
