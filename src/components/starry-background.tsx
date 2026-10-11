"use client";

import { useEffect, useRef } from "react";

const CONFIG = {
  mobileStars: 80,
  desktopStars: 220,
  skyTop: "#050816",
  skyBottom: "#0f1535",
  /** Night fill only in dark mode, so light-mode text stays readable. */
  nightSkyInLightMode: false,
  violet: "#8b5cf6",
  cyan: "#22d3ee",
  emerald: "#34d399",
  constellationMin: 6,
  constellationMax: 8,
  constellationGap: 5200,
  drawSpeed: 0.55,
  cometSpeed: 0.35,
  fadeSpeed: 0.35,
  shootMin: 8000,
  shootMax: 12000,
  auroraSpeed: 0.00015,
} as const;

type Star = {
  x: number;
  y: number;
  r: number;
  layer: 0 | 1 | 2;
  phase: number;
  alpha: number;
};

type Point = { x: number; y: number };

type Constellation = {
  points: Point[];
  drawn: number;
  mode: "draw" | "comet" | "fade" | "wait";
  alpha: number;
  wait: number;
};

type Shot = { x: number; y: number; vx: number; vy: number; life: number };

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const surface = canvas;
    const ctx = context;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let frame = 0;
    let running = true;
    let shot: Shot | null = null;
    let nextShot = rand(CONFIG.shootMin, CONFIG.shootMax);
    let constellation: Constellation = {
      points: [],
      drawn: 0,
      mode: "wait",
      alpha: 0,
      wait: 400,
    };

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      surface.width = Math.floor(width * dpr);
      surface.height = Math.floor(height * dpr);
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = width < 768 ? CONFIG.mobileStars : CONFIG.desktopStars;
      stars = Array.from({ length: count }, () => {
        const layer = Math.floor(Math.random() * 3) as 0 | 1 | 2;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.4 + layer * 0.55,
          layer,
          phase: Math.random() * Math.PI * 2,
          alpha: 0.25 + Math.random() * 0.55,
        };
      });
    }

    function calm(x: number, y: number) {
      const dx = (x / width - 0.5) / 0.32;
      const dy = (y / height - 0.3) / 0.22;
      return Math.min(1, Math.max(0.12, Math.hypot(dx, dy) - 0.15));
    }

    function spawnPath() {
      const count = Math.floor(
        rand(CONFIG.constellationMin, CONFIG.constellationMax + 1),
      );
      const side = Math.random() < 0.5 ? 0.08 : 0.62;
      const points: Point[] = [];
      let x = width * side + rand(0, width * 0.22);
      let y = height * rand(0.55, 0.82);
      for (let i = 0; i < count; i += 1) {
        points.push({ x, y });
        x += rand(36, 78) * (side < 0.3 ? 1 : -1);
        y += rand(-46, 34);
      }
      constellation = { points, drawn: 0, mode: "draw", alpha: 1, wait: 0 };
    }

    function drawSky() {
      const dark = document.documentElement.classList.contains("dark");
      if (!dark && !CONFIG.nightSkyInLightMode) return;
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, CONFIG.skyTop);
      sky.addColorStop(1, CONFIG.skyBottom);
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);
    }

    function drawAurora(time: number) {
      const colors = [CONFIG.violet, CONFIG.cyan, CONFIG.emerald];
      colors.forEach((color, index) => {
        ctx.beginPath();
        const yBase = height * (0.62 + index * 0.08);
        for (let x = 0; x <= width; x += 24) {
          const y =
            yBase +
            Math.sin(x * 0.004 + time * CONFIG.auroraSpeed + index) * 28;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.07;
        ctx.lineWidth = 36;
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    }

    function drawStars(time: number) {
      const dark = document.documentElement.classList.contains("dark");
      for (const star of stars) {
        const twinkle = reduceMotion
          ? star.alpha
          : star.alpha * (0.65 + Math.sin(time * 0.002 + star.phase) * 0.35);
        ctx.globalAlpha = twinkle * calm(star.x, star.y) * (dark ? 1 : 0.55);
        ctx.fillStyle = star.layer === 2 ? CONFIG.cyan : "#e8eefc";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function pointAt(t: number): Point {
      const pts = constellation.points;
      const max = Math.max(pts.length - 1, 1);
      const clamped = Math.min(Math.max(t, 0), max);
      const i = Math.min(Math.floor(clamped), pts.length - 2);
      const local = clamped - i;
      const a = pts[i];
      const b = pts[Math.min(i + 1, pts.length - 1)];
      return { x: a.x + (b.x - a.x) * local, y: a.y + (b.y - a.y) * local };
    }

    function drawConstellation() {
      const pts = constellation.points;
      if (pts.length < 2 || constellation.alpha <= 0) return;
      ctx.globalAlpha = constellation.alpha * 0.85;
      ctx.strokeStyle = CONFIG.violet;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      const links = Math.min(constellation.drawn, pts.length - 1);
      for (let i = 0; i < Math.floor(links); i += 1) {
        ctx.lineTo(pts[i + 1].x, pts[i + 1].y);
      }
      if (links > 0 && links < pts.length - 1) {
        const tip = pointAt(links);
        ctx.lineTo(tip.x, tip.y);
      }
      ctx.stroke();

      const shown = Math.min(pts.length, Math.floor(links) + 1);
      for (let i = 0; i < shown; i += 1) {
        ctx.fillStyle = i % 2 === 0 ? CONFIG.cyan : CONFIG.emerald;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      if (constellation.mode === "comet" || constellation.mode === "fade") {
        for (let n = 6; n >= 0; n -= 1) {
          const p = pointAt(constellation.drawn - n * 0.15);
          ctx.globalAlpha = constellation.alpha * (0.15 + n * 0.08);
          ctx.fillStyle = CONFIG.cyan;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.5 - n * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    function step(dt: number) {
      if (reduceMotion) return;
      if (constellation.mode === "wait") {
        constellation.wait -= dt;
        if (constellation.wait <= 0) spawnPath();
        return;
      }
      if (constellation.mode === "draw") {
        constellation.drawn += dt * 0.001 * CONFIG.drawSpeed;
        if (constellation.drawn >= constellation.points.length - 1) {
          constellation.drawn = 0;
          constellation.mode = "comet";
        }
        return;
      }
      if (constellation.mode === "comet") {
        constellation.drawn += dt * 0.001 * CONFIG.cometSpeed;
        if (constellation.drawn >= constellation.points.length - 1) {
          constellation.mode = "fade";
        }
        return;
      }
      constellation.alpha -= dt * 0.001 * CONFIG.fadeSpeed;
      if (constellation.alpha <= 0) {
        constellation = {
          points: [],
          drawn: 0,
          mode: "wait",
          alpha: 0,
          wait: CONFIG.constellationGap,
        };
      }
    }

    function drawShot(dt: number) {
      if (reduceMotion) return;
      nextShot -= dt;
      if (!shot && nextShot <= 0) {
        shot = {
          x: rand(width * 0.2, width * 0.85),
          y: rand(height * 0.05, height * 0.35),
          vx: rand(180, 320),
          vy: rand(40, 90),
          life: 1,
        };
        nextShot = rand(CONFIG.shootMin, CONFIG.shootMax);
      }
      if (!shot) return;
      shot.x += (shot.vx * dt) / 1000;
      shot.y += (shot.vy * dt) / 1000;
      shot.life -= dt / 700;
      ctx.globalAlpha = Math.max(shot.life, 0);
      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(shot.x, shot.y);
      ctx.lineTo(shot.x - 28, shot.y - 8);
      ctx.stroke();
      ctx.globalAlpha = 1;
      if (shot.life <= 0) shot = null;
    }

    let last = performance.now();
    function loop(now: number) {
      if (!running) return;
      const dt = Math.min(now - last, 50);
      last = now;
      frame = requestAnimationFrame(loop);
      if (document.visibilityState !== "visible") return;

      ctx.setTransform(
        Math.min(window.devicePixelRatio || 1, 2),
        0,
        0,
        Math.min(window.devicePixelRatio || 1, 2),
        0,
        0,
      );
      ctx.clearRect(0, 0, width, height);
      drawSky();
      drawAurora(now);
      drawStars(now);
      if (!reduceMotion) step(dt);
      drawConstellation();
      drawShot(dt);
    }

    resize();
    if (reduceMotion) {
      drawSky();
      drawStars(0);
    } else {
      frame = requestAnimationFrame(loop);
    }
    window.addEventListener("resize", resize);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
    />
  );
}
