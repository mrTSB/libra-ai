import { JurisSearchResponse, JurisPatentResult } from "@/lib/juris";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  response: JurisSearchResponse | null;
};

function PatentItem({ item, index }: { item: JurisPatentResult; index: number }) {
  return (
    <AccordionItem value={`result-${index}`}>
      <AccordionTrigger className="text-sm hover:no-underline cursor-pointer">
        <div className="flex flex-col items-start text-left">
          <span className="font-medium line-clamp-2">{item.title}</span>
          <span className="text-xs text-muted-foreground">
            {item.result_type === "local_corpus" ? "Local corpus" : "Web search"}
            {item.similarity_score != null ? ` • score ${item.similarity_score.toFixed(3)}` : ""}
            {item.patent_number ? ` • ${item.patent_number}` : ""}
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {item.source && (
          <a
            className="text-xs text-muted-foreground leading-tight p-3 rounded-xl bg-muted block hover:bg-muted/50 hover:text-muted-foreground transition-all mb-2 break-all"
            href={item.source}
            target="_blank"
            rel="noreferrer"
          >
            {item.source}
          </a>
        )}
        <div className="p-3 text-xs whitespace-pre-wrap">{item.description}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function JurisResults({ response }: Props) {
  if (!response) return null;
  const { similar_patents, search_summary, local_results_count, web_results_count } = response;
  return (
    <div className="space-y-6 w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-normal">
            {search_summary} • {local_results_count} local • {web_results_count} web
          </CardTitle>
        </CardHeader>
      </Card>

      <Accordion type="multiple" className="w-full">
        {similar_patents.map((item, idx) => (
          <PatentItem key={idx} item={item} index={idx} />
        ))}
      </Accordion>
    </div>
  );
}
