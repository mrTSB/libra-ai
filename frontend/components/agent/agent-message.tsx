import { Brain } from "lucide-react";
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

// Helper function to render a single message part
const renderMessagePart = (part: any, key: string | number) => {
  if (part.type.includes("tool")) {
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
            return <Diff key={key} className="mt-2" oldText={oldText} newText={newText} />;
          }
          return (
            <div key={key} className="text-xs text-muted-foreground">
              Diff input ready
            </div>
          );
        }
        case "output-available": {
          // We do not apply the diff; just show it. If the model produced output, prefer it.
          const { oldText, newText } = (part.output || part.input) ?? {};
          if (typeof oldText === "string" && typeof newText === "string") {
            return <Diff key={key} className="mt-2" oldText={oldText} newText={newText} />;
          }
          return (
            <div key={key} className="text-xs text-muted-foreground">
              Diff output ready
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

export function Message({
  message,
  className,
  onApplyDiff,
}: {
  message: UIMessage;
  className?: string;
  onApplyDiff?: (args: { toolCallId: string; oldText: string; newText: string }) => void;
}) {
  const firstTextIndex = message.parts.findIndex((part) => part.type === "text");
  const hasTextPart = firstTextIndex !== -1;

  const shouldShowAccordion = firstTextIndex !== 0; // Show if first part is not text
  const accordionDefaultValue = !hasTextPart ? "reasoning" : undefined; // Open if no text parts
  const partsInAccordion = shouldShowAccordion ? message.parts.slice(0, firstTextIndex) : [];
  const partsAfter = hasTextPart ? message.parts.slice(firstTextIndex) : [];

  // If there is no text part at all, render all parts directly to avoid hiding tools
  if (!hasTextPart) {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className={cn("flex flex-col gap-1 relative")}>
          {message.parts.map((part, index) => {
            if (
              part.type === "tool-write_diff" &&
              (part.state === "input-available" || part.state === "output-available")
            ) {
              const payload: any = part.output ?? part.input;
              const oldText = typeof payload?.oldText === "string" ? payload.oldText : undefined;
              const newText = typeof payload?.newText === "string" ? payload.newText : undefined;
              return (
                <div key={index} className="flex items-center gap-2">
                  {renderMessagePart(part, index)}
                  {onApplyDiff && oldText && newText ? (
                    <button
                      className="text-xs px-2 py-1 border rounded-md hover:bg-muted"
                      onClick={() => onApplyDiff({ toolCallId: part.toolCallId, oldText, newText })}
                    >
                      Apply changes
                    </button>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Tool</span> called
                    </div>
                  )}
                </div>
              );
            }
            return renderMessagePart(part, index);
          })}
        </div>
      </div>
    );
  }

  if (!shouldShowAccordion) {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className={cn("flex flex-col gap-1 relative")}>
          {message.parts.map((part, index) => {
            if (part.type === "tool-write_diff" && part.state === "output-available") {
              const payload: any = part.output ?? part.input;
              const oldText = typeof payload?.oldText === "string" ? payload.oldText : undefined;
              const newText = typeof payload?.newText === "string" ? payload.newText : undefined;
              return (
                <div key={index} className="flex items-center gap-2">
                  {renderMessagePart(part, index)}
                  {onApplyDiff && oldText && newText ? (
                    <button
                      className="text-xs px-2 py-1 border rounded-md hover:bg-muted"
                      onClick={() => onApplyDiff({ toolCallId: part.toolCallId, oldText, newText })}
                    >
                      Apply changes
                    </button>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Tool</span> called
                    </div>
                  )}
                </div>
              );
            }
            return renderMessagePart(part, index);
          })}
        </div>
      </div>
    );
  }

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
          if (part.type === "tool-write_diff" && part.state === "output-available") {
            const payload: any = part.output ?? part.input;
            const oldText = typeof payload?.oldText === "string" ? payload.oldText : undefined;
            const newText = typeof payload?.newText === "string" ? payload.newText : undefined;
            return (
              <div key={key} className="flex items-center gap-2">
                {renderMessagePart(part, key)}
                {onApplyDiff && oldText && newText ? (
                  <button
                    className="text-xs px-2 py-1 border rounded-md hover:bg-muted"
                    onClick={() => onApplyDiff({ toolCallId: part.toolCallId, oldText, newText })}
                  >
                    Apply changes
                  </button>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <span className="font-semibold">Tool</span> called
                  </div>
                )}
              </div>
            );
          }
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
  onApplyDiff?: (args: { toolCallId: string; oldText: string; newText: string }) => void;
}) {
  return (
    <div className={cn("space-y-2 my-2", className)}>
      <Message message={message} onApplyDiff={onApplyDiff} />
    </div>
  );
}
