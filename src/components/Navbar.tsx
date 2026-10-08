"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, CircleUser } from "lucide-react";
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
      <header className="sticky top-0 z-50 bg-transparent">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Learning Path Generator
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
    <header className="sticky top-0 z-50 border-b border-border/40 bg-transparent">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
          Learning Path Generator
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {!isAuthPage && (
            <>
              {user ? (
                <AuthedControls user={user} onLogout={handleLogout} />
              ) : (
                <>
                  {pathname !== "/paths/new" && pathname !== "/dashboard" && (
                    <Link
                      href="/paths/new"
                      className="rounded-lg bg-primary px-3 py-1.5 text-primary-foreground transition-colors hover:bg-primary/80"
                    >
                      New Path
                    </Link>
                  )}
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
          {/* <ThemeToggle /> */}
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
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <CircleUser className="size-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-44 rounded-lg border border-border bg-card p-1 shadow-md">
          <p className="px-3 py-1.5 text-sm font-medium">{user.username}</p>
          <Link
            href="/dashboard"
            className="block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-4" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
