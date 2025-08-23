import { Brain, Check } from "lucide-react";
import Diff from "@/components/agent/diff";
import { cn } from "@/lib/utils";

function Thought({ duration }: { duration: number }) {
  return (
    <div className="flex flex-row items-center gap-1 text-sm text-muted-foreground/80 px-2">
      <Brain className="h-4 w-4" />
      <span>
        <span className="font-semibold">Thought</span> for {duration}s
      </span>
    </div>
  );
}

import { cva } from "class-variance-authority";
import React from "react";
import { ToolUIPart, UIMessage } from "ai";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ChatReasoning from "@/components/agent/chat-reasoning";
import Markdown from "@/components/ui/markdown";

export function Message({
  message,
  className,
  onApplyDiff,
}: {
  message: UIMessage;
  className?: string;
  onApplyDiff?: (args: { toolCallId?: string; oldText: string; newText: string }) => void;
}) {
  const parts = message.parts ?? [];
  const firstTextIndex = parts.findIndex((part) => part.type === "text");
  const hasTextPart = firstTextIndex !== -1;

  // Render a single message part (has access to onApplyDiff)
  const renderMessagePart = (part: any, key: string | number) => {
    console.log(JSON.stringify(part, null, 2));
    if (part.type === "tool-write_diff") {
      switch (part.state) {
        case "input-streaming":
          return (
            <div key={key} className="text-xs text-muted-foreground">
              Preparing diff preview...
            </div>
          );
        case "input-available": {
          const { oldText, newText } = part.input || {};
          if (typeof oldText === "string" && typeof newText === "string") {
            return (
              <Diff
                key={key}
                className="mt-2"
                oldText={oldText}
                newText={newText}
                toolCallId={(part as any).toolCallId}
                onApply={onApplyDiff}
              />
            );
          }
          return (
            <div key={key} className="text-xs text-muted-foreground">
              Diff input ready
            </div>
          );
        }
        case "output-available": {
          const payload: any = (part.output || part.input) ?? {};
          const { oldText, newText } = payload;
          if (typeof oldText === "string" && typeof newText === "string") {
            return (
              <Diff
                key={key}
                className="mt-2"
                oldText={oldText}
                newText={newText}
                toolCallId={(part as any).toolCallId}
                onApply={onApplyDiff}
              />
            );
          }
          return (
            <div
              key={key}
              className="text-sm font-bold text-muted-foreground fill-muted-foreground flex items-center gap-1"
            >
              Applied diff <Check className="h-4 w-4" />
            </div>
          );
        }
        case "output-error":
          return (
            <div key={key} className="text-xs text-destructive">
              Failed to render diff: {part.errorText}
            </div>
          );
      }
    } else if (part.type === "text") {
      return <Markdown key={key}>{part.text}</Markdown>;
    } else if (part.type === "reasoning") {
      return (
        <Markdown key={key} size="sm" className="text-sm text-muted-foreground mt-0.5">
          {part.text}
        </Markdown>
      );
    }
    return <pre>{JSON.stringify(part, null, 2)}</pre>;
  };

  const accordionDefaultValue = !hasTextPart ? "reasoning" : undefined; // Open if no text parts
  const partsInAccordion = hasTextPart ? parts.slice(0, firstTextIndex) : parts;
  const partsAfter = hasTextPart ? parts.slice(firstTextIndex) : [];

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className={cn("flex flex-col gap-1 relative text-sm")}>
        <ChatReasoning
          renderMessagePart={renderMessagePart}
          partsInAccordion={partsInAccordion}
          defaultValue={accordionDefaultValue}
        />
        {partsAfter.map((part, index) => {
          const key = firstTextIndex + index;
          return renderMessagePart(part, key);
        })}
      </div>
    </div>
  );
}

export default function AgentMessage({
  className,
  message,
  thoughtDuration,
  onApplyDiff,
}: {
  className?: string;
  message: UIMessage;
  thoughtDuration: number;
  onApplyDiff?: (args: { toolCallId?: string; oldText: string; newText: string }) => void;
}) {
  return (
    <div className={cn("space-y-2 my-2", className)}>
      <Message message={message} onApplyDiff={onApplyDiff} />
    </div>
  );
}
