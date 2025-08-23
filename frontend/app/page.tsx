"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { postOrchestrator, type OrchestratorResponse } from "@/lib/orchestrator";
import {
  Bot,
  Search,
  Workflow,
  FileText,
  MessageSquareText,
  Beaker,
  Compass,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRoute(nextQuery?: string) {
    const effective = (nextQuery ?? query).trim();
    if (!effective) return;
    setLoading(true);
    setError(null);
    try {
      const res = await postOrchestrator({ query: effective });
      const agent = res.selected_agent;
      if (agent === "lexi") {
        const usp = new URLSearchParams({ q: effective, auto: "1" });
        router.push(`/lexi?${usp.toString()}`);
      } else if (agent === "juris") {
        const usp = new URLSearchParams({ q: effective, auto: "1" });
        router.push(`/juris?${usp.toString()}`);
      } else if (agent === "filora") {
        const usp = new URLSearchParams({ instructions: effective, auto: "1" });
        router.push(`/filora?${usp.toString()}`);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to route");
    } finally {
      setLoading(false);
    }
  }

  const sections = [
    {
      href: "/lexi",
      title: "Lexi",
      description: "Legal advisor grounded in the law",
      icon: MessageSquareText,
    },
    {
      href: "/juris",
      title: "Juris",
      description: "Prior art search and analysis of patents.",
      icon: Search,
    },
    {
      href: "/filora",
      title: "Filora",
      description: "Automated form filling using browser.",
      icon: Workflow,
    },
    {
      href: "/donna",
      title: "Donna",
      description: "Instant inbound triage and email drafting.",
      icon: FileText,
    },
    {
      href: "/sage",
      title: "Sage",
      description: "Instant legal discovery across all your data.",
      icon: Bot,
    },
    {
      href: "/juno",
      title: "Juno",
      description: "Cursor for legal documents.",
      icon: Beaker,
    },
  ];

  return (
    <div className="container mx-auto p-4 flex-1 flex flex-col gap-10 relative">
      <span className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 h-40 w-[36rem] bg-primary/20 blur-3xl rounded-full -z-10" />
      <span className="pointer-events-none absolute top-1/3 right-0 h-32 w-72 bg-gradient-to-l from-primary/20 to-transparent blur-3xl rounded-full -z-10" />
      <span className="pointer-events-none absolute bottom-10 left-10 h-24 w-40 bg-gradient-to-tr from-primary/10 to-transparent blur-2xl rounded-full -z-10" />
      <div className="flex flex-col items-center text-center gap-3 mt-16 flex-1 min-h-0 justify-center">
        <h1 className="text-8xl font-serif font-semibold text-transparent bg-clip-text bg-gradient-to-b from-stone-800 to-stone-800/40">
          Welcome to Libra
        </h1>
        <h3 className="text-3xl font-serif italic text-muted-foreground/80">
          The agentic paralegal. Letting you focus on the big picture.
        </h3>
        <div className="relative w-full max-w-2xl self-center">
          <Input
            placeholder="Ask anything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="w-full p-6 py-8 text-lg rounded-3xl shadow-xl shadow-foreground/5 hover:bg-muted/50"
          />
          <Button
            onClick={() => handleRoute()}
            disabled={loading || query.trim().length === 0}
            variant="fancy"
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:-translate-y-1/2 active:-translate-y-1/2"
          >
            {loading ? (
              "Routing..."
            ) : (
              <span className="inline-flex items-center gap-1">
                <span>Ask Swarm</span>
                <ArrowRight className="size-4" />
              </span>
            )}
          </Button>
        </div>
        {/* <div className="self-center flex flex-wrap items-center justify-center gap-2 text-sm max-w-2xl">
          {[
            "Summarize this NDA and list key risks",
            "Find precedent for implied covenant of good faith",
            "Create a workflow to review 50 contracts",
            "Draft a retention policy for legal documents",
          ].map((s) => (
            <button
              key={s}
              className="rounded-full border border-border/80 hover:border-transparent bg-white px-3 py-1 shadow-md shadow-foreground/5 hover:shadow-none hover:bg-primary/10 transition-colors"
              onClick={() => handleRoute(s)}
            >
              {s}
            </button>
          ))}
        </div> */}
      </div>

      {error && <div className="text-sm text-red-600 self-center">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl self-center w-full pb-24">
        {sections.map((s) => {
          const Icon = s.icon as any;
          return (
            <Link key={s.href} href={s.href} className="group">
              <Card
                variant="fancy_light"
                className={cn(
                  "relative overflow-hidden h-full transition-all duration-300 ease-out group-hover:-translate-y-0.5 border-border group-hover:scale-105 group-active:scale-95 group-active:shadow-xl"
                )}
              >
                <CardHeader className="relative z-10 max-w-1/2">
                  <CardTitle className="text-5xl font-serif mt-4">{s.title}</CardTitle>
                  <CardDescription className="text-md -mb-2 text-muted-foreground/60">
                    {s.description}
                  </CardDescription>
                </CardHeader>
                <Image
                  src={`/assets/${s.href}.jpeg`}
                  alt={s.title}
                  width={1000}
                  height={1000}
                  className="w-full h-full object-cover absolute inset-0 grayscale mix-blend-multiply opacity-50 translate-x-1/4 group-hover:scale-110 transition-all duration-300 ease-out"
                />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
