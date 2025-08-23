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
      <div className="text-lg font-medium mb-2">References to the law</div>
      <Accordion type="multiple" className="w-full">
        {items.map((item, idx) => (
          <AccordionItem key={idx} value={`local-${idx}`}>
            <AccordionTrigger className="text-sm hover:no-underline cursor-pointer">
              <div className="flex flex-col items-start">
                <span className="font-medium line-clamp-2">{item.summary ?? item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {item.source === "basic-laws-book-2016" ? "Basic Laws" : "The Rule of Law"}• chunk{" "}
                  score {item.relevance_score ?? "–"}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="text-xs overflow-auto whitespace-pre-wrap">{item.content}</div>
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
      <div className="text-lg font-medium mb-2">Community intelligence</div>
      <Accordion type="multiple" className="w-full">
        {items.map((item, idx) => (
          <AccordionItem key={idx} value={`web-${idx}`}>
            <AccordionTrigger className="text-sm hover:no-underline cursor-pointer">
              <div className="flex flex-col items-start">
                <h3 className="font-medium">{item.title}</h3>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <a
                className="text-xs text-muted-foreground leading-tight p-3 rounded-xl bg-muted block hover:bg-muted/50 hover:text-muted-foreground transition-all"
                href={item.source}
                target="_blank"
                rel="noreferrer"
              >
                {item.source}
              </a>
              <div className="p-3 text-xs">{item.content}</div>
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
    <div className="grid md:grid-cols-2 gap-4 mt-8 px-4">
      <LocalList items={response.local_context_used} />
      <WebList items={response.web_context_used} />
    </div>
  );
}
