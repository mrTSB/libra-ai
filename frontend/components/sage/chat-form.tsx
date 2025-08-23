"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type Props = {
  onSubmit: (params: {
    prompt: string;
    use_web_search: boolean;
    model_name: string;
    temperature: number;
    stream: boolean;
    chat_id: string;
    title: string;
  }) => void;
  loading?: boolean;
};

export function SageChatForm({ onSubmit, loading }: Props) {
  const [prompt, setPrompt] = useState("");
  const [useWeb, setUseWeb] = useState(false);
  const [temperature, setTemperature] = useState(0);
  const [modelName, setModelName] = useState("claude-sonnet-4-20250514");

  return (
    <div className="flex flex-col justify-center items-center h-full">
      <h1 className="text-9xl font-serif font-semibold scale-110 text-transparent bg-clip-text bg-gradient-to-b from-stone-800 to-stone-800/40">
        Sage
      </h1>
      <h3 className="text-4xl font-serif font-semibold italic text-muted-foreground/80 mb-10">
        Your reasoning assistant
      </h3>

      <div className="relative w-full max-w-2xl mb-8">
        <Input
          placeholder="Ask Sage..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
          className="w-full p-6 py-8 text-lg rounded-3xl shadow-xl shadow-foreground/5 hover:bg-muted/50"
        />

        <Button
          onClick={() =>
            onSubmit({
              prompt,
              use_web_search: useWeb,
              model_name: modelName,
              temperature,
              stream: false,
              chat_id: "",
              title: "",
            })
          }
          disabled={loading || prompt.trim().length === 0}
          variant="fancy"
          className="absolute right-3 top-1/2 -translate-y-1/2 hover:-translate-y-1/2 active:-translate-y-1/2"
        >
          {loading ? "Asking..." : "Ask Sage"}
        </Button>
      </div>

      <div className="flex items-center gap-4 mb-16">
        <div className="flex items-center space-x-2">
          <Switch id="use-web" checked={useWeb} onCheckedChange={setUseWeb} />
          <Label htmlFor="use-web">Use web search</Label>
        </div>
      </div>
    </div>
  );
}
