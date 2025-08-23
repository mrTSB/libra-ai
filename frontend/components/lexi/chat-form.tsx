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
    <Card>
      <CardHeader>
        <CardTitle>Lexi Q&A</CardTitle>
      </CardHeader>
      <Input
        placeholder="Ask a legal question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
      />
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch id="useWeb" checked={useWeb} onCheckedChange={setUseWeb} />
          <Label htmlFor="useWeb">Use web search</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch id="useLocal" checked={useLocal} onCheckedChange={setUseLocal} />
          <Label htmlFor="useLocal">Use local docs</Label>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="maxLocal">Max local results</Label>
          <Input
            id="maxLocal"
            type="number"
            min={0}
            value={maxLocal}
            onChange={(e) => setMaxLocal(Number(e.target.value))}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="maxWeb">Max web results</Label>
          <Input
            id="maxWeb"
            type="number"
            min={0}
            value={maxWeb}
            onChange={(e) => setMaxWeb(Number(e.target.value))}
            disabled={loading}
          />
        </div>
      </div>
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
      >
        {loading ? "Asking..." : "Ask Lexi"}
      </Button>
    </Card>
  );
}
