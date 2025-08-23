"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { postOrchestrator, type OrchestratorResponse } from "@/lib/orchestrator";

export default function OrchestratorPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OrchestratorResponse | null>(null);

  const auto = params.get("auto");
  const q = params.get("q") || params.get("query");

  useEffect(() => {
    if (q) setQuery(q);
  }, [q]);

  useEffect(() => {
    if (q && auto === "1") {
      void handleRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, auto]);

  async function handleRoute() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await postOrchestrator({ query });
      setResult(res);
      const agent = res.selected_agent;
      if (agent === "lexi") {
        const usp = new URLSearchParams({ q: query, auto: "1" });
        router.push(`/lexi?${usp.toString()}`);
      } else if (agent === "juris") {
        const usp = new URLSearchParams({ q: query, auto: "1" });
        router.push(`/juris?${usp.toString()}`);
      } else if (agent === "filora") {
        // Minimal prefill for Filora: put the query into instructions
        const usp = new URLSearchParams({ instructions: query, auto: "1" });
        router.push(`/filora?${usp.toString()}`);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to route");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto max-w-3xl p-4 space-y-6 min-h-0 flex-1 flex flex-col items-center justify-center">
      <div className="w-full text-center">
        <h1 className="text-7xl font-serif font-semibold text-transparent bg-clip-text bg-gradient-to-b from-stone-800 to-stone-800/40">
          Orchestrator
        </h1>
        <h3 className="text-2xl font-serif italic text-muted-foreground/80">
          Routes your query to the right agent
        </h3>
      </div>

      <div className="relative w-full max-w-2xl">
        <Input
          placeholder="Ask anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="w-full p-6 py-8 text-lg rounded-3xl shadow-xl shadow-foreground/5 hover:bg-muted/50"
        />
        <Button
          onClick={handleRoute}
          disabled={loading || query.trim().length === 0}
          variant="fancy"
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          {loading ? "Routing..." : "Route"}
        </Button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}
