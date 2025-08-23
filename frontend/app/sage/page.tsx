"use client";

import { useEffect, useRef, useState } from "react";
import { SageChatMessages } from "@/components/sage/chat-messages";
import { fetchSageChat, postSageChat, type SageChatResponse, type SageMessage } from "@/lib/sage";
import { SageComposer } from "@/components/sage/composer";
import { SageChatSwitcher } from "@/components/sage/chat-switcher";
import { cn } from "@/lib/utils";

export default function SagePage() {
  const [response, setResponse] = useState<SageChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatId = response?.chat_id || "";
  const [messages, setMessages] = useState<SageMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedChat, setSelectedChat] = useState<string | "new">("new");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    async function loadSelected() {
      if (selectedChat && selectedChat !== "new") {
        setLoading(true);
        setError(null);
        try {
          const data = await fetchSageChat(selectedChat);
          setResponse(data);
          setMessages(data.messages);
        } catch (e: any) {
          setError(e?.message ?? "Failed to load chat");
        } finally {
          setLoading(false);
        }
      } else {
        setResponse(null);
        setMessages([]);
      }
    }
    loadSelected();
  }, [selectedChat]);

  async function handleAsk(params: Parameters<typeof postSageChat>[0]) {
    setLoading(true);
    setError(null);
    try {
      const res = await postSageChat(params);
      setResponse(res);
      if (res.chat_id && selectedChat !== res.chat_id) {
        setSelectedChat(res.chat_id);
      }
      setMessages(res.messages);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(prompt: string) {
    // Optimistically show the user's message
    setMessages((prev) => [...prev, { role: "user", content: prompt }]);
    await handleAsk({
      prompt,
      use_web_search: true,
      model_name: "claude-sonnet-4-20250514",
      temperature: 0,
      stream: false,
      chat_id: selectedChat !== "new" ? selectedChat : chatId,
      title: "",
    });
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-2 overflow-y-auto flex flex-col min-h-0 flex-1 items-center justify-center w-full">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="w-full flex items-center justify-end">
        <SageChatSwitcher
          value={selectedChat}
          onChange={(v) => {
            setSelectedChat(v);
          }}
        />
      </div>

      <div
        ref={scrollRef}
        className={cn("overflow-y-auto p-4 w-full max-w-2xl ", messages.length > 0 && "flex-1")}
      >
        {messages.length === 0 ? (
          <div className="grid place-items-center text-center text-muted-foreground">
            <div className="space-y-0">
              <h1 className="text-9xl font-serif font-semibold  scale-110 pt-4 text-transparent bg-clip-text bg-gradient-to-b from-stone-800 to-stone-800/40 pb-4 pl-4">
                Sage
              </h1>
              <h3 className="text-4xl font-serif font-semibold italic text-muted-foreground/80 -mb-4">
                Make connections across your data.
              </h3>
            </div>
          </div>
        ) : (
          <SageChatMessages messages={messages} loading={loading} />
        )}
      </div>

      <div className={cn("sticky bottom-4 w-full", messages.length > 0 && "mb-12")}>
        <SageComposer onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
