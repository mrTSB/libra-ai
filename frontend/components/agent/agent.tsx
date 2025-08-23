"use client";
import AgentMessage from "@/components/agent/agent-message";
import UserMessage from "@/components/agent/user-message";
import ChatInput from "@/components/agent/chat-input";
import { cn } from "@/lib/utils";

import { useChat } from "@ai-sdk/react";
import { useState, type ChangeEvent, type FormEvent } from "react";
import type { UIMessage } from "ai";

export default function Agent({ className }: { className?: string }) {
  const { messages, sendMessage } = useChat({});

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
      parts: [{ type: "text", text }],
    });
    setInput("");
  }

  function getTextFromMessage(message: UIMessage): string {
    if (!message.parts) return "";
    return message.parts.map((part) => ("text" in part ? part.text : "")).join("");
  }

  return (
    <div className={cn("flex flex-col gap-2 relative", className)}>
      {messages.map((message) => {
        const text = getTextFromMessage(message as UIMessage);
        return message.role === "user" ? (
          <UserMessage message={text} key={message.id} />
        ) : (
          <AgentMessage message={message} thoughtDuration={4} key={message.id} />
        );
      })}
      <ChatInput
        className="absolute bottom-0 w-full "
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
