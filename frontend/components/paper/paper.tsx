"use client";
import { cn } from "@/lib/utils";
import Markdown from "@/components/ui/markdown";
import { diffChars } from "diff";
import * as React from "react";

export default function Paper({
  className,
  paper,
  setPaper,
  toolDiff,
}: {
  className?: string;
  paper: string;
  setPaper: (paper: string) => void;
  toolDiff?: { oldText: string; newText: string } | null;
}) {
  const segments = React.useMemo(() => {
    if (toolDiff && toolDiff.oldText && toolDiff.newText) {
      return diffChars(toolDiff.oldText, toolDiff.newText);
    }
    return [] as ReturnType<typeof diffChars>;
  }, [toolDiff]);
  const hasToolDiff = React.useMemo(() => segments.length > 0, [segments]);
  const inlineIndex = React.useMemo(() => {
    if (toolDiff && toolDiff.oldText) {
      return paper.indexOf(toolDiff.oldText);
    }
    return -1;
  }, [paper, toolDiff]);
  const canRenderInline = hasToolDiff && inlineIndex >= 0;
  const beforeText = canRenderInline ? paper.slice(0, inlineIndex) : "";
  const afterText = canRenderInline
    ? paper.slice(inlineIndex + (toolDiff?.oldText?.length || 0))
    : "";

  return (
    <div
      className={cn(
        "overflow-y-auto space-y-2 rounded-2xl border border-stone-300 bg-white p-6 shadow-lg shadow-stone-400/20 transition-all hover:-translate-y-px hover:shadow-xl",
        className
      )}
    >
      {canRenderInline ? (
        <div className="relative w-full">
          {beforeText ? <Markdown className="mb-0">{beforeText}</Markdown> : null}
          <div className="whitespace-pre-wrap leading-relaxed">
            {segments.map((segment, idx) => {
              if (segment.added) {
                return (
                  <span
                    key={idx}
                    className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
                  >
                    {segment.value}
                  </span>
                );
              }
              if (segment.removed) {
                return (
                  <span
                    key={idx}
                    className="bg-red-100 text-red-900 line-through dark:bg-red-900/30 dark:text-red-300"
                  >
                    {segment.value}
                  </span>
                );
              }
              return <span key={idx}>{segment.value}</span>;
            })}
          </div>
          {afterText ? <Markdown className="mt-0">{afterText}</Markdown> : null}
        </div>
      ) : (
        <>
          {hasToolDiff ? (
            <div className="relative leading-relaxed">
              {segments.map((segment, idx) => {
                if (segment.added) {
                  return (
                    <span
                      key={idx}
                      className="bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300"
                    >
                      {segment.value}
                    </span>
                  );
                }
                if (segment.removed) {
                  return (
                    <span
                      key={idx}
                      className="bg-red-100 text-red-900 line-through dark:bg-red-900/30 dark:text-red-300"
                    >
                      {segment.value}
                    </span>
                  );
                }
                return <span key={idx}>{segment.value}</span>;
              })}
            </div>
          ) : null}
          <Markdown>{paper}</Markdown>
        </>
      )}
    </div>
  );
}
