import { cn } from "@/lib/utils";
import { diffChars, createPatch } from "diff";

export default function Diff({
  className,
  oldText,
  newText,
  onApply,
  toolCallId,
}: {
  className?: string;
  oldText: string;
  newText: string;
  onApply?: (args: { toolCallId?: string; oldText: string; newText: string }) => void;
  toolCallId?: string;
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
      <div className="flex w-full flex-row items-center justify-between gap-2 border-b p-1 pl-2 px-1 text-xs text-muted-foreground">
        <div>Lines</div>
        <div className="flex items-center gap-2">
          <span>
            <span className="text-constructive">+{addedCount}</span>{" "}
            <span className="text-destructive">-{removedCount}</span> Hover to view old text
          </span>
          {onApply ? (
            <button
              className="ml-2 rounded-md border px-1 py-0.5 text-xs hover:bg-muted"
              onClick={() => onApply({ toolCallId, oldText, newText })}
            >
              Apply changes
            </button>
          ) : null}
        </div>
      </div>
      <div className="group relative min-h-0 flex-1 overflow-hidden bg-card p-2 py-0 text-sm flex flex-col justify-center items-center">
        <div className="w-full h-fit my-auto">
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
        </div>
        <div className="absolute top-0 h-16 w-full bg-gradient-to-b from-card to-transparent"></div>
        <div className="absolute bottom-0 h-16 w-full bg-gradient-to-t from-card to-transparent"></div>
      </div>
    </div>
  );
}
