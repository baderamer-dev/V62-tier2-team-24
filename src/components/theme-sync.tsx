"use client";

import { useEffect, useSyncExternalStore } from "react";

const STORAGE_KEY = "theme";

function subscribe(onChange: () => void) {
  window.addEventListener("theme-change", onChange);
  return () => window.removeEventListener("theme-change", onChange);
}

function getIsDark() {
  return localStorage.getItem(STORAGE_KEY) !== "light";
}

export function ThemeSync() {
  const isDark = useSyncExternalStore(subscribe, getIsDark, () => true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return null;
}