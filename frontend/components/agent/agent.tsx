"use client";
import AgentMessage from "@/components/agent/agent-message";
import UserMessage from "@/components/agent/user-message";
import ChatInput from "@/components/agent/chat-input";
import { cn } from "@/lib/utils";

import { useChat } from "@ai-sdk/react";

export default function Agent({ className }: { className?: string }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({});

  return (
    <div className={cn("flex flex-col gap-2 relative bg-red-500 h-full", className)}>
      {messages.map((message) =>
        message.role === "user" ? (
          <UserMessage message={message.content} key={message.id} />
        ) : (
          <AgentMessage message={message.content} thoughtDuration={4} key={message.id} />
        )
      )}
      <ChatInput
        className="absolute bottom-0 w-full "
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
