"use client";

import { usePathname } from "next/navigation";
import { StarryBackground } from "@/components/starry-background";

const PAGES = new Set(["/", "/login", "/signup", "/paths/new"]);

export function StarryOnPages() {
  const pathname = usePathname();
  if (!PAGES.has(pathname)) return null;
  return <StarryBackground />;
}