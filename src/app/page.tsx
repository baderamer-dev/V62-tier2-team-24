import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Database,
  RefreshCw,
  Target,
  User,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: User,
    title: "AI-Driven Personalization",
    text: "Our model analyzes your goals and pace to craft a unique learning path.",
  },
  {
    icon: Zap,
    title: "Instant Generation",
    text: "Get a complete, structured roadmap in seconds, no waiting.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    text: "Visual milestones keep you accountable throughout your journey.",
  },
  {
    icon: RefreshCw,
    title: "Adaptive Updates",
    text: "Your path evolves as you learn, and the AI recalibrates with you.",
  },
  {
    icon: Target,
    title: "Goal-Oriented Structure",
    text: "Each step is sequenced so you build on the last and transfer skills.",
  },
  {
    icon: Database,
    title: "Curated Resources",
    text: "Every milestone links to vetted free and premium resources.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center">
      <h1 className="max-w-3xl text-4xl font-extrabold tracking-tight sm:text-6xl">
        Your learning path
        <br />
        Build for you
      </h1>

      <p className="mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
        Stop guessing what to learn next. Our AI analyzes your goals, current
        skills, and available time to generate a precise, step-by-step learning
        path tailored exclusively for you.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className="pulse-ring">
          <Button size="lg" variant="outline" className="min-w-56 font-bold">
            Get started
          </Button>
        </Link>
        <Link href="/paths/new">
          <Button variant="outline" size="lg" className="min-w-56">
            Continue as guest
          </Button>
        </Link>
      </div>

      <section className="mt-24 w-full text-center">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything you need to level up
        </h2>

        <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-xl border border-border/50 bg-card/50 p-5 backdrop-blur"
              >
                <Icon className="size-5 text-primary" />
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
