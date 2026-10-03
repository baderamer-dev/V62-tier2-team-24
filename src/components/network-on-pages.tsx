"use client";

import { usePathname } from "next/navigation";
import { NetworkBackground } from "@/components/network-background";

const PAGES = new Set(["/", "/login", "/signup", "/paths/new"]);

export function NetworkOnPages() {
  const pathname = usePathname();
  if (!PAGES.has(pathname)) return null;
  return <NetworkBackground />;
}