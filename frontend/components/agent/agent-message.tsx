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
    return <div key={key}>Tool</div>;
  } else if (part.type === "text") {
    return <Markdown key={key}>{part.text}</Markdown>;
  } else if (part.type === "reasoning") {
    return (
      <Markdown key={key} className="text-sm text-muted-foreground">
        {part.text}
      </Markdown>
    );
  }
  return null;
};

export function Message({ message, className }: { message: UIMessage; className?: string }) {
  const firstTextIndex = message.parts.findIndex((part) => part.type === "text");
  const hasTextPart = firstTextIndex !== -1;

  const shouldShowAccordion = firstTextIndex !== 0; // Show if first part is not text
  const accordionDefaultValue = !hasTextPart ? "reasoning" : undefined; // Open if no text parts
  const partsInAccordion = shouldShowAccordion ? message.parts.slice(0, firstTextIndex) : [];
  const partsAfter = hasTextPart ? message.parts.slice(firstTextIndex) : [];

  if (!shouldShowAccordion) {
    return (
      <div className={cn("flex items-start gap-3", className)}>
        <div className={cn("flex flex-col gap-1 relative")}>
          {message.parts.map((part, index) => renderMessagePart(part, index))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className={cn("flex flex-col gap-1 relative")}>
        <ChatReasoning
          renderMessagePart={renderMessagePart}
          partsInAccordion={partsInAccordion}
          defaultValue={accordionDefaultValue}
        />
        {partsAfter.map((part, index) => renderMessagePart(part, firstTextIndex + index))}
      </div>
    </div>
  );
}

export default function AgentMessage({
  className,
  message,
  thoughtDuration,
}: {
  className?: string;
  message: UIMessage;
  thoughtDuration: number;
}) {
  return (
    <div className={cn("space-y-2 my-2", className)}>
      <Thought duration={thoughtDuration} />
      <Message message={message} />
      <Diff
        className="mt-2"
        oldText="However, a closer examination reveals that argumentative essays can be tools for intellectual exploration and even delaying definitive conclusions. This essay will argue that the very structure and demands of the argumentative essay inherently make it a superior placeholder for ideas that are still in development. Despite the common perception of an argumentative essay as a battle of wills, its purpose here is far more constructive: to create a robust foundation for future development."
        newText="However, a closer examination reveals that argumentative essays can be tools for intellectual exploration and even delaying definitive conclusions. This essay will argue that the need for reasoned claims, evidence, and counterarguments inherently make it a superior placeholder for ideas that are still in development. Despite the common perception of an argumentative essay as a battle of wills, its purpose here is far more constructive: to create a robust foundation for future development."
        lineRange={[24, 28]}
      />
    </div>
  );
}
