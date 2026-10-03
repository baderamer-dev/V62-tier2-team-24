"use client";

import { useEffect, useRef } from "react";

const TOPICS = [
  "Backend",
  "Frontend",
  "Hacking",
  "Python",
  "JavaScript",
  "React",
  "Next.js",
  "AI",
  "Data",
  "DevOps",
  "SQL",
  "TypeScript",
  "Cybersecurity",
  "Cloud",
  "UI Design",
  "APIs",
  "Linux",
  "Git",
  "Mobile",
  "Machine Learning",
  "Node.js",
  "Docker",
  "Kubernetes",
  "AWS",
  "Firebase",
  "GraphQL",
  "HTML",
  "CSS",
  "Figma",
  "Product",
  "UX",
  "Testing",
  "Java",
  "C++",
  "Go",
  "Rust",
  "PHP",
  "Django",
  "Spring",
  "MongoDB",
  "Postgres",
  "Redis",
  "Blockchain",
  "Web3",
  "Prompting",
  "ChatGPT",
  "Excel",
  "Analytics",
  "SEO",
  "Marketing",
  "Swift",
  "Kotlin",
  "Flutter",
  "Unity",
  "Game Dev",
  "Networking",
  "Pentesting",
  "Ethical Hacking",
  "System Design",
  "Algorithms",
  "Interview Prep",
];

const LINK_DISTANCE = 220;

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  label?: string;
};

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const surface: HTMLCanvasElement = canvas;
    const context: CanvasRenderingContext2D = ctx;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let frame = 0;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      surface.width = width * dpr;
      surface.height = height * dpr;
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      const count = width < 768 ? 70 : 160;
      const labelCount = width < 768 ? 14 : 36;
      nodes = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        label: index < labelCount ? TOPICS[index % TOPICS.length] : undefined,
      }));
    }

    function colors() {
      const dark = document.documentElement.classList.contains("dark");
      return dark
        ? {
            line: "rgba(180, 220, 255, 0.16)",
            dot: "rgba(200, 230, 255, 0.65)",
            text: "rgba(220, 235, 255, 0.72)",
          }
        : {
            line: "rgba(15, 23, 42, 0.2)",
            dot: "rgba(15, 23, 42, 0.55)",
            text: "rgba(15, 23, 42, 0.72)",
          };
    }

    function draw() {
      const { line, dot, text } = colors();
      context.clearRect(0, 0, width, height);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (!reduceMotion) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > width) a.vx *= -1;
          if (a.y < 0 || a.y > height) a.vy *= -1;
        }

        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            context.globalAlpha = 1 - dist / LINK_DISTANCE;
            context.strokeStyle = line;
            context.lineWidth = 0.8;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
          }
        }
      }

      context.globalAlpha = 1;
      context.font = "11px Geist, ui-sans-serif, system-ui, sans-serif";
      context.textAlign = "left";
      context.textBaseline = "middle";

      for (const node of nodes) {
        context.fillStyle = dot;
        context.beginPath();
        context.arc(node.x, node.y, node.label ? 2.4 : 1.4, 0, Math.PI * 2);
        context.fill();

        if (node.label) {
          context.fillStyle = text;
          context.fillText(node.label, node.x + 8, node.y);
        }
      }
    }

    function loop() {
      draw();
      if (!reduceMotion) frame = requestAnimationFrame(loop);
    }

    resize();
    seed();
    draw();
    if (!reduceMotion) frame = requestAnimationFrame(loop);

    const onResize = () => {
      resize();
      seed();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("theme-change", draw);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("theme-change", draw);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
    />
  );
}
