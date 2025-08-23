"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  onSubmit: (params: {
    description: string;
    title?: string | null;
    inventor?: string | null;
    use_web_search: boolean;
    use_local_corpus: boolean;
    max_local_results: number;
    max_web_results: number;
  }) => void;
  loading?: boolean;
};

export function JurisSearchForm({ onSubmit, loading }: Props) {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [inventor, setInventor] = useState("");

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <h1 className="text-9xl font-serif font-semibold  scale-110 text-transparent bg-clip-text bg-gradient-to-b from-stone-800 to-stone-800/40">
        Juris
      </h1>
      <h3 className="text-4xl font-serif font-semibold italic text-muted-foreground/80 mb-10">
        Patent prior art and similarity search
      </h3>

      <div className="relative w-full max-w-2xl space-y-3 mb-20">
        <Input
          placeholder="Short description of the invention"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          className="w-full p-6 py-8 text-lg rounded-3xl shadow-xl shadow-foreground/5 hover:bg-muted/50"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Input
            placeholder="Optional title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            className="w-full p-4 rounded-2xl"
          />
          <Input
            placeholder="Optional inventor"
            value={inventor}
            onChange={(e) => setInventor(e.target.value)}
            disabled={loading}
            className="w-full p-4 rounded-2xl"
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={() =>
              onSubmit({
                description,
                title: title || null,
                inventor: inventor || null,
                use_web_search: true,
                use_local_corpus: true,
                max_local_results: 5,
                max_web_results: 5,
              })
            }
            disabled={loading || description.trim().length === 0}
            variant="fancy"
            className="hover:-translate-y-0"
          >
            {loading ? "Searching..." : "Search patents"}
          </Button>
        </div>
      </div>
    </div>
  );
}
