import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
      <div className="space-y-1.5">
        <p className="text-lg font-semibold">No paths yet</p>
        <p className="text-sm text-muted-foreground">
          Generate your first path to see it here.
        </p>
      </div>
      <Link href="/paths/new">
        <Button className="h-10 rounded-full px-6">
          Generate your first path
        </Button>
      </Link>
    </div>
  );
}