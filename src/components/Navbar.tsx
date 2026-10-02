"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getStoredUser, logout, type AuthUser } from "@/features/auth/api";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  // Read auth state from localStorage on mount and on route changes
  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  function handleLogout() {
    logout();
    setUser(null);
    router.push("/");
  }

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  // ── Landing page header ────────────────────────────────────────────────────
  if (pathname === "/") {
    return (
      <header className="bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex flex-col leading-tight">
            <span className="text-base font-semibold tracking-tight">
              Waypoint
            </span>
            <span className="text-[11px] text-muted-foreground">
              AI-Powered Learning Path for{" "}
              <span className="inline-block animate-wave">Professionals</span>
            </span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            {user ? (
              <AuthedControls user={user} onLogout={handleLogout} />
            ) : (
              <Link
                href="/login"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Login
              </Link>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>
    );
  }

  // ── App header ─────────────────────────────────────────────────────────────
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

        <nav className="flex items-center gap-3 text-sm">
          {!isAuthPage && (
            <>
              {user ? (
                <AuthedControls user={user} onLogout={handleLogout} />
              ) : (
                <>
                  <Link
                    href="/paths/new"
                    className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground transition-colors hover:bg-primary/80"
                  >
                    New Path
                  </Link>
                  <Link
                    href="/login"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Login
                  </Link>
                </>
              )}
            </>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

// ── Authenticated controls ─────────────────────────────────────────────────

function AuthedControls({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        title="Dashboard"
      >
        <LayoutDashboard className="size-4" />
        <span className="hidden sm:inline">{user.username}</span>
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
        title="Log out"
      >
        <LogOut className="size-4" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </div>
  );
}
