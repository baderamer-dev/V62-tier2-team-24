"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getStoredUser } from "@/features/auth/api";

export function HomeCtas() {
  const user = useSyncExternalStore(
    () => () => {},
    getStoredUser,
    () => null,
  );

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Link href={user ? "/dashboard" : "/login"} className="pulse-ring">
        <Button size="lg" variant="outline" className="min-w-56 font-bold">
          Get started
        </Button>
      </Link>
      {!user && (
        <Link href="/paths/new">
          <Button variant="outline" size="lg" className="min-w-56">
            Continue as guest
          </Button>
        </Link>
      )}
    </div>
  );
}