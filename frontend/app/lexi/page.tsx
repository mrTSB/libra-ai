"use client";

import { useState } from "react";
import { LexiChatForm } from "@/components/lexi/chat-form";
import { LexiChatResponseView } from "@/components/lexi/chat-response";
import { LexiContextList } from "@/components/lexi/context-list";
import { LexiChatResponse, postLexiChat } from "@/lib/lexi";
import Reveal from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "motion/react";

export default function LexiPage() {
  const [response, setResponse] = useState<LexiChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedQuestion, setSubmittedQuestion] = useState<string | null>(null);

  async function handleAsk(params: Parameters<typeof postLexiChat>[0]) {
    setSubmittedQuestion(params.question);
    setResponse(null);
    setLoading(true);
    setError(null);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const res = await postLexiChat(params);
      setResponse(res);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-6 overflow-y-auto flex flex-col min-h-0 flex-1">
      <AnimatePresence>
        {submittedQuestion && (
          <motion.div
            key={submittedQuestion}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="sticky top-0 z-10 -mt-4 -mx-4 px-4 pt-4 pb-2 bg-background/70 backdrop-blur border-b"
          >
            <h2 className="text-lg font-semibold truncate">{submittedQuestion}</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {!submittedQuestion && !loading && <LexiChatForm onSubmit={handleAsk} loading={loading} />}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-24 w-full" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-11/12" />
            <Skeleton className="h-6 w-10/12" />
          </div>
        </div>
      )}

      {!loading && response && (
        <>
          <Reveal index={0}>
            <LexiChatResponseView response={response} />
          </Reveal>
          <Reveal index={1}>
            <LexiContextList response={response} />
          </Reveal>
        </>
      )}
    </div>
  );
}
