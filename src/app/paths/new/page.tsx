import { NewPathForm } from "@/features/paths/components/new-path-form";

export const metadata = {
  title: "Build your learning path",
};

export default function NewPathPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Build Your Learning Path
        </h1>
        <p className="mt-3 text-muted-foreground">
          Fill in the details below and let our AI craft your personalized
          roadmap in seconds.
        </p>
      </div>
      <NewPathForm />
    </main>
  );
}
