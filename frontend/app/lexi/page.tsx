"use client";

import { useState } from "react";
import { LexiChatForm } from "@/components/lexi/chat-form";
import { LexiChatResponseView } from "@/components/lexi/chat-response";
import { LexiContextList } from "@/components/lexi/context-list";
import { LexiChatResponse, postLexiChat } from "@/lib/lexi";

export default function LexiPage() {
  const [response, setResponse] = useState<LexiChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(params: Parameters<typeof postLexiChat>[0]) {
    setLoading(true);
    setError(null);
    try {
      const res = await postLexiChat(params);
      setResponse(res);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-6 overflow-y-auto">
      <LexiChatForm onSubmit={handleAsk} loading={loading} />
      {error && <div className="text-sm text-red-600">{error}</div>}
      <LexiChatResponseView response={response} />
      <LexiContextList response={response} />
    </div>
  );
}
