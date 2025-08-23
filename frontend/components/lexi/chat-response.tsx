import { Card, CardTitle, CardHeader } from "@/components/ui/card";
import { LexiChatResponse } from "@/lib/lexi";
import Markdown from "@/components/ui/markdown";

type Props = {
  response: LexiChatResponse | null;
};

export function LexiChatResponseView({ response }: Props) {
  if (!response) return null;
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Answer</CardTitle>
        </CardHeader>

        <Markdown>{response.answer || ""}</Markdown>
      </Card>
      {response.reasoning && (
        <Card>
          <CardHeader>
            <CardTitle>Reasoning</CardTitle>
          </CardHeader>
          <Markdown>{response.reasoning}</Markdown>
        </Card>
      )}
    </div>
  );
}
