"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const SEEN_KEY = "app:result-tour-seen";

function subscribe() {
  return () => {};
}

function seenOnClient() {
  return localStorage.getItem(SEEN_KEY) === "1";
}

function wideOnClient() {
  return window.matchMedia("(min-width: 1024px)").matches;
}

function subscribeWide(onChange: () => void) {
  const media = window.matchMedia("(min-width: 1024px)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useResultTour() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const seen = useSyncExternalStore(subscribe, seenOnClient, () => true);
  const wide = useSyncExternalStore(subscribeWide, wideOnClient, () => false);
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [replay, setReplay] = useState(false);
  const show = mounted && (!seen || replay) && !finished;
  const order = wide ? [0, 1, 2, 3] : [2, 3];

  useEffect(() => {
    if (!show) return;
    localStorage.setItem(SEEN_KEY, "1");
  }, [show]);

  function advance() {
    if (index >= order.length - 1) {
      localStorage.setItem(SEEN_KEY, "1");
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
  }

  function restart() {
    localStorage.removeItem(SEEN_KEY);
    setIndex(0);
    setFinished(false);
    setReplay(true);
  }

  return {
    step: show ? order[index] : -1,
    isLast: index >= order.length - 1,
    advance,
    restart,
  };
}

export function TourHint({
  id,
  step,
  text,
  isLast,
  onAdvance,
  className,
}: {
  id: number;
  step: number;
  text: string;
  isLast: boolean;
  onAdvance: () => void;
  className?: string;
}) {
  if (step !== id) return null;

  return (
    <div
      className={`absolute z-30 w-52 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-medium text-emerald-950 shadow-lg ${className ?? ""}`}
      style={{ animation: "tour-in 280ms ease-out" }}
    >
      <style>{`@keyframes tour-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
      <p>{text}</p>
      <button
        type="button"
        onClick={onAdvance}
        className="mt-2 rounded-md bg-emerald-950/15 px-2 py-1"
      >
        {isLast ? "Done" : "Next"}
      </button>
    </div>
  );
}