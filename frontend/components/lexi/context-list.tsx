import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LexiChatResponse, LexiLocalContext, LexiWebContext } from "@/lib/lexi";

type Props = {
  response: LexiChatResponse | null;
};

function LocalList({ items }: { items: LexiLocalContext[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-sm font-medium mb-2">Local context used</div>
      <Accordion type="multiple" className="w-full">
        {items.map((item, idx) => (
          <AccordionItem key={idx} value={`local-${idx}`}>
            <AccordionTrigger className="text-sm">
              <div className="flex flex-col items-start">
                <span className="font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {item.source} • chunk {item.metadata?.chunk_index} • score{" "}
                  {item.relevance_score ?? "–"}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap">
                {item.content}
              </div>
              {item.metadata && (
                <div className="text-[10px] text-muted-foreground mt-2">
                  {item.metadata.document_path} • start sentence {item.metadata.start_sentence} •
                  size {item.metadata.size}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

function WebList({ items }: { items: LexiWebContext[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <div className="text-sm font-medium mb-2">Web context used</div>
      <Accordion type="multiple" className="w-full">
        {items.map((item, idx) => (
          <AccordionItem key={idx} value={`web-${idx}`}>
            <AccordionTrigger className="text-sm">
              <div className="flex flex-col items-start">
                <a
                  href={item.source}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline"
                >
                  {item.title}
                </a>
                <span className="text-xs text-muted-foreground">{item.source}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="rounded bg-muted p-3 text-xs overflow-auto whitespace-pre-wrap">
                {item.content}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

export function LexiContextList({ response }: Props) {
  if (!response) return null;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <LocalList items={response.local_context_used} />
      <WebList items={response.web_context_used} />
    </div>
  );
}
