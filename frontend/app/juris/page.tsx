"use client";

import { useState } from "react";
import { JurisSearchForm } from "@/components/juris/search-form";
import { JurisResults } from "@/components/juris/results";
import { JurisSearchResponse, postJurisSearch } from "@/lib/juris";
import Reveal from "@/components/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence, motion } from "motion/react";

export default function JurisPage() {
  const [response, setResponse] = useState<JurisSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedQuery, setSubmittedQuery] = useState<string | null>(null);

  async function handleSearch(params: Parameters<typeof postJurisSearch>[0]) {
    setSubmittedQuery(params.description);
    setResponse(null);
    setLoading(true);
    setError(null);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
      const res = await postJurisSearch(params);
      setResponse(res);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-2 overflow-y-auto flex flex-col min-h-0 flex-1 items-center justify-center w-full">
      <AnimatePresence>
        {submittedQuery && (
          <motion.div
            key={submittedQuery}
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="px-4 pt-4 w-full"
          >
            <h2 className="text-5xl font-semibold font-serif tracking-tight truncate pb-2">
              {submittedQuery}
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        <motion.div
          key={submittedQuery ? "submitted" : "not-submitted"}
          initial={{ y: -20, opacity: 0, filter: "blur(10px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: 20, opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          {!submittedQuery && !loading && (
            <JurisSearchForm onSubmit={handleSearch} loading={loading} />
          )}
        </motion.div>
      </AnimatePresence>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading && (
        <div className="space-y-6 w-full min-h-0 flex-1 px-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-11/12" />
            <Skeleton className="h-6 w-10/12" />
          </div>
        </div>
      )}

      {!loading && response && (
        <div className="space-y-6 w-full min-h-0 flex-1 items-start justify-start">
          <Reveal>
            <JurisResults response={response} />
          </Reveal>
        </div>
      )}
    </div>
  );
}
