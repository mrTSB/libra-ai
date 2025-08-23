"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  onSubmit: (params: {
    question: string;
    use_web_search: boolean;
    use_local_docs: boolean;
    max_local_results: number;
    max_web_results: number;
  }) => void;
  loading?: boolean;
};

export function LexiChatForm({ onSubmit, loading }: Props) {
  const [question, setQuestion] = useState("");
  const [useWeb, setUseWeb] = useState(true);
  const [useLocal, setUseLocal] = useState(true);
  const [maxLocal, setMaxLocal] = useState(5);
  const [maxWeb, setMaxWeb] = useState(3);

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <h1 className="text-9xl font-serif font-semibold  scale-110 text-transparent bg-clip-text bg-gradient-to-b from-stone-800 to-stone-800/40">
        Lexi
      </h1>
      <h3 className="text-4xl font-serif font-semibold italic text-muted-foreground/80 mb-10">
        Your expert on the law
      </h3>

      <div className="relative w-full max-w-2xl mb-32">
        <Input
          placeholder="Is it legal to..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={loading}
          className="w-full p-6 py-8 text-lg rounded-3xl shadow-xl shadow-foreground/5 hover:bg-muted/50"
        />

        <Button
          onClick={() =>
            onSubmit({
              question,
              use_web_search: useWeb,
              use_local_docs: useLocal,
              max_local_results: maxLocal,
              max_web_results: maxWeb,
            })
          }
          disabled={loading || question.trim().length === 0}
          variant="fancy"
          className="absolute right-3 top-1/2 -translate-y-1/2 hover:-translate-y-1/2 active:-translate-y-1/2"
        >
          {loading ? "Asking..." : "Ask Lexi"}
        </Button>
      </div>
    </div>
  );
}
