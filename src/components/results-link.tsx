"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export function ResultsLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  function openLastPath(event: React.MouseEvent<HTMLAnchorElement>) {
    const id = localStorage.getItem("last-learning-path-id");
    if (!id) return;
    event.preventDefault();
    router.push(`/paths/${id}`);
  }

  return (
    <Link href="/paths/new" onClick={openLastPath} className={className}>
      {children}
    </Link>
  );
}