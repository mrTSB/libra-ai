"use client";
import { cn } from "@/lib/utils";

export default function Paper({
  className,
  paper,
  setPaper,
}: {
  className?: string;
  paper: string;
  setPaper: (paper: string) => void;
}) {
  return (
    <div
      className={cn(
        "overflow-y-auto space-y-2 rounded-2xl border border-stone-300 bg-white p-6 shadow-lg shadow-stone-400/20 transition-all hover:-translate-y-px hover:shadow-xl",
        className
      )}
    >
      {paper}
    </div>
  );
}
