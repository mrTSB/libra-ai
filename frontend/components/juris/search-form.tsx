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
      <h1 className="text-9xl font-serif font-semibold  scale-110 text-transparent bg-clip-text bg-gradient-to-b from-stone-800 to-stone-800/40 pb-4 pl-4">
        Juris
      </h1>
      <h3 className="text-4xl font-serif font-semibold italic text-muted-foreground/80 mb-10 pb-2">
        Patent prior art and similarity search
      </h3>

      <div className="relative w-full max-w-2xl mb-20">
        <Input
          placeholder="Short description of the invention"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
          className="w-full p-6 py-8 text-lg rounded-3xl shadow-xl shadow-foreground/5 hover:bg-muted/50"
        />

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
          className="hover:-translate-y-1/2 active:-translate-y-1/2 absolute right-3 top-1/2 -translate-y-1/2"
        >
          {loading ? "Searching..." : "Search patents"}
        </Button>
      </div>
    </div>
  );
}
