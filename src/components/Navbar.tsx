"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { ResultsLink } from "@/components/results-link";

export default function Navbar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return (
      <header className="bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">
              Waypoint
            </span>
            <span className="text-[11px] text-muted-foreground">
              AI-Powered Learning Path for Professionals
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex flex-col leading-tight">
          <span className="text-base font-semibold tracking-tight">
            Waypoint
          </span>
          <span className="text-[11px] text-muted-foreground">
            AI-Powered Learning Path for Professionals
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <ResultsLink className="text-muted-foreground hover:text-foreground transition-colors">
            Results
          </ResultsLink>
          <Link
            href="/paths/new"
            className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            New Path
          </Link>
          <Link
            href="/login"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
