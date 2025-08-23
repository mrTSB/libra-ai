import { cn } from "@/lib/utils";
import { diffChars, createPatch } from "diff";

export default function Diff({
  className,
  oldText,
  newText,
}: {
  className?: string;
  oldText: string;
  newText: string;
}) {
  const diff = diffChars(oldText, newText);

  const addedCount = diff.filter((d) => d.added).length;
  const removedCount = diff.filter((d) => d.removed).length;

  return (
    <div
      className={cn(
        "relative flex h-48 w-full flex-col overflow-y-auto rounded-xl border shadow-2xs transition-all",
        className
      )}
    >
      <div className="flex w-full flex-row justify-between border-b p-2 px-3 text-xs text-muted-foreground">
        <div>Lines</div>
        <div>
          <span className="text-constructive">+{addedCount}</span>{" "}
          <span className="text-destructive">-{removedCount}</span> Hover to view old text
        </div>
      </div>
      <div className="group relative min-h-0 flex-1 overflow-hidden bg-card p-2 py-0 font-serif text-sm">
        {diff.map((segment, index) => {
          if (segment.added) {
            return (
              <span key={index} className="inline text-constructive group-hover:hidden">
                {segment.value}
              </span>
            );
          } else if (segment.removed) {
            return (
              <span key={index} className="hidden text-destructive group-hover:inline">
                {segment.value}
              </span>
            );
          } else {
            return (
              <span key={index} className="inline">
                {segment.value}
              </span>
            );
          }
        })}
        <div className="absolute top-0 h-16 w-full bg-gradient-to-b from-card to-transparent"></div>
        <div className="sticky bottom-0 h-16 w-full bg-gradient-to-t from-card to-transparent"></div>
      </div>
    </div>
  );
}
