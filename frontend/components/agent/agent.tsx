"use client";
import AgentMessage from "@/components/agent/agent-message";
import UserMessage from "@/components/agent/user-message";
import ChatInput from "@/components/agent/chat-input";
import { cn } from "@/lib/utils";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from "ai";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { UIMessage } from "ai";
import { Circle } from "lucide-react";

export default function Agent({
  className,
  paper,
  setPaper,
  onToolDiffPreview,
}: {
  className?: string;
  paper?: string;
  setPaper?: (paper: string) => void;
  onToolDiffPreview?: (diff: { oldText: string; newText: string } | null) => void;
}) {
  const { messages, sendMessage, addToolResult, error, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
  });

  const [input, setInput] = useState("");

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    // v5: send a UI message with parts array
    void sendMessage({
      role: "user",
      parts: [
        { type: "text", text },
        {
          type: "text",
          text: `Current document content (fenced):\n\n\`\`\`text\n${paper ?? ""}\n\`\`\``,
        },
      ],
    });
    setInput("");
  }

  // Surface latest tool diff preview to parent so the Paper view can highlight it
  useEffect(() => {
    if (!onToolDiffPreview) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i] as UIMessage;
      if (msg.role !== "assistant" || !msg.parts) continue;
      const part: any = msg.parts.find(
        (p: any) =>
          p?.type === "tool-write_diff" &&
          (p?.state === "input-available" || p?.state === "output-available")
      );
      if (part) {
        const payload: any = (part.output || part.input) ?? {};
        const { oldText, newText } = payload ?? {};
        if (typeof oldText === "string" && typeof newText === "string") {
          onToolDiffPreview({ oldText, newText });
          return;
        }
      }
    }
    onToolDiffPreview(null);
  }, [messages, onToolDiffPreview]);

  function getTextFromMessage(message: UIMessage): string {
    if (!message.parts) return "";
    return message.parts.map((part) => ("text" in part ? part.text : "")).join("");
  }

  return (
    <div
      className={cn("flex flex-col gap-2 relative max-h-full overflow-y-auto h-full", className)}
    >
      <div className="flex-1 overflow-y-auto h-full min-h-0">
        {messages.map((message) => {
          const text = getTextFromMessage(message as UIMessage);
          return message.role === "user" ? (
            <UserMessage message={text} key={message.id} />
          ) : (
            <AgentMessage
              message={message}
              thoughtDuration={4}
              key={message.id}
              onApplyDiff={({ toolCallId, oldText, newText }) => {
                if (typeof setPaper === "function") {
                  // naive application: replace oldText with newText in the current paper
                  setPaper((paper ?? "").replace(oldText, newText));
                }
                if (toolCallId) {
                  addToolResult({
                    tool: "write_diff",
                    toolCallId,
                    output: { applied: true },
                  });
                }
              }}
            />
          );
        })}
        {error && <div className="text-destructive">{error.message}</div>}
      </div>
      <ChatInput
        className="sticky bottom-0 w-full"
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
