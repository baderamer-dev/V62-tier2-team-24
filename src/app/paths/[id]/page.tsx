"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { LearningPath } from "@/types";
import {
  ArrowRight,
  Clock3,
  Layers3,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 font-bold text-white">
      <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500">
        <Layers3 className="size-5" />
      </span>
      <span className="text-lg">PathBuilder</span>
    </Link>
  );
}

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#070b12] p-8 text-center text-white">
        <h1 className="text-2xl font-bold">Learning path unavailable</h1>
        <p className="max-w-md text-[#a1a4ac]">
          This path is saved in the browser session that generated it. Generate
          a new path to view its steps.
        </p>
        <Link
          href="/paths/new"
          className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-[#070b12]"
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
    <div className="relative z-10 min-h-screen bg-[#070b12] font-sans text-white">
      <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-white/10 bg-[#090d15]/95 px-4 backdrop-blur md:px-7">
        <Brand />
        <nav className="hidden gap-8 text-sm text-[#858895] md:flex">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
        <Link
          href="/paths/new"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-500 px-4 py-3 text-sm font-bold"
        >
          Generate Path <ArrowRight className="size-4" />
        </Link>
      </header>
      <div className="flex min-h-[1100px]">
        <aside className="hidden w-[286px] shrink-0 border-r border-white/10 bg-[#090d15] px-3 py-6 lg:block">
          <Link
            href="/paths/new"
            className="flex h-11 items-center justify-center gap-1 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-sm font-semibold text-emerald-400"
          >
            <Plus className="size-4" /> New Path
          </Link>
          <div className="mt-6 flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-[#686c78]">
            <Search className="size-4" /> Search paths...
          </div>
          <div className="mt-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-[#686c78]">
            Sort: Recently opened
          </div>
          <p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[.14em] text-[#464b58]">
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
                    className={`size-2 rounded-full ${path.active ? "bg-emerald-400" : "bg-[#363b46]"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-[#d6d9df]">
                      {path.title}
                    </p>
                    <p className="mt-1 text-[10px] text-[#555a65]">
                      {path.detail}
                    </p>
                  </div>
                  {path.progress != null && (
                    <span className="text-[10px] text-emerald-400">
                      {path.progress}%
                    </span>
                  )}
                </div>
                <div className="mt-2 h-[2px] rounded-full bg-white/10">
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
          <section className="border-b border-white/10 px-5 pb-5 pt-6 md:px-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                    {path.goal}
                  </span>
                  <span className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs capitalize text-cyan-400">
                    {path.skillLevel}
                  </span>
                  <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
                    {totalWeeks} weeks estimated
                  </span>
                </div>
                <p className="mt-2 pl-3 text-xs text-[#777b85]">
                  {completed} of {steps.length} steps completed
                </p>
              </div>
            </div>
            <div className="mt-7 flex items-center gap-4">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#1a1f27]">
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
              <div className="absolute bottom-0 left-5 top-0 w-px bg-white/10 md:left-1/2" />
              <div className="relative space-y-16 md:space-y-28">
                {steps.map((step, index) => (
                  <div
                    key={step.stepNumber}
                    className={`relative flex pl-16 md:pl-0 ${index % 2 ? "md:justify-end md:pl-[52%]" : "md:justify-start md:pr-[52%]"}`}
                  >
                    <article className="w-full max-w-[320px] rounded-2xl border border-white/10 bg-[#10141c] p-6">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {["🌱", "⚡", "🔥", "🎯"][index % 4]}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-[#a1a4ac]">
                          Step {step.stepNumber}
                        </span>
                        <span className="ml-auto grid size-6 place-items-center rounded-full border-2 border-[#4b515c]" />
                      </div>
                      <h2 className="mt-4 text-base font-bold text-[#f0f1f4]">
                        {step.title}
                      </h2>
                      <p className="mt-3 text-[13px] leading-relaxed text-[#8a8e99]">
                        {step.description}
                      </p>
                      <p className="mt-3 flex items-center gap-1.5 text-xs text-[#777b85]">
                        <Clock3 className="size-3.5" /> Est:{" "}
                        {step.estimatedWeeks}{" "}
                        {step.estimatedWeeks === 1 ? "week" : "weeks"}
                      </p>
                    </article>
                    <span className="absolute left-0 top-6 z-10 grid size-10 place-items-center rounded-full border-2 border-[#353b46] bg-[#0a0e16] font-semibold text-[#989ca6] md:left-1/2 md:-translate-x-1/2">
                      {step.stepNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <Link
              href="/paths/new"
              className="mt-24 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-8 py-4 text-sm font-bold"
            >
              <Sparkles className="size-4" /> Generate a New Path
            </Link>
          </section>
        </main>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-white/10 bg-[#0a0e16] px-4 py-7 text-xs text-[#747985] md:px-7">
        <div className="flex items-center gap-5">
          <Brand />
          <span>© 2026 Voyage 62. All rights reserved.</span>
        </div>
        <Link href="/dashboard">Dashboard</Link>
      </footer>
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
