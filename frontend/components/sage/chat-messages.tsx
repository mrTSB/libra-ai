import Markdown from "@/components/ui/markdown";
import { cn } from "@/lib/utils";
import type { SageMessage } from "@/lib/sage";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import React from "react";

type Props = {
  messages: SageMessage[];
  loading?: boolean;
};

export function SageChatMessages({ messages, loading }: Props) {
  return (
    <div className="w-full space-y-6">
      {messages.map((m, idx) => (
        <div
          key={idx}
          className={cn("flex w-full", m.role === "user" ? "justify-end" : "justify-start")}
        >
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm",
              m.role === "user" ? "bg-primary/40 max-w-[80%] " : "mr-8"
            )}
          >
            {m.role === "assistant" ? (
              <AssistantContent content={m.content} />
            ) : (
              <div className="whitespace-pre-wrap">{m.content}</div>
            )}
          </div>
        </div>
      ))}
      {loading && (
        <div className="flex w-full justify-start">
          <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-muted text-foreground">
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]"></span>
              <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce"></span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function AssistantContent({ content }: { content: string }) {
  const parts = splitByCite(content);
  return (
    <div className="space-y-2">
      {parts.map((p, i) =>
        typeof p === "string" ? (
          <Markdown className="inline-block" key={i}>
            {p}
          </Markdown>
        ) : (
          <InlineCite key={i} data={p} />
        )
      )}
    </div>
  );
}

type CiteEmail = {
  type: "email";
  id: string;
  subject: string;
  date: string;
  sender: string;
  quote: string;
};

type CiteWeb = {
  type: "web";
  title: string;
  url: string;
  quote: string;
};

type CiteData = CiteEmail | CiteWeb;

function splitByCite(text: string): Array<string | CiteData> {
  const result: Array<string | CiteData> = [];
  const regex = /<cite>([\s\S]*?)<\/cite>/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index);
    if (before) result.push(before);
    const jsonRaw = match[1].trim();
    try {
      const data = JSON.parse(jsonRaw) as CiteData;
      if (data && (data as any).type) {
        result.push(data);
      } else {
        result.push(match[0]);
      }
    } catch {
      result.push(match[0]);
    }
    lastIndex = regex.lastIndex;
  }
  const after = text.slice(lastIndex);
  if (after) result.push(after);
  return result;
}

function InlineCite({ data }: { data: CiteData }) {
  const label = data.type === "email" ? data.subject : data.title;
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="inline-block text-xs text-primary bg-foreground/5 rounded-md px-1.5 py-0.5 hover:bg-foreground/20 transition-all duration-300">
          {label}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 rounded-2xl shadow-lg shadow-foreground/5">
        <CiteCard data={data} />
      </HoverCardContent>
    </HoverCard>
  );
}

function CiteCard({ data }: { data: CiteData }) {
  if (data.type === "email") {
    const d = data as CiteEmail;
    return (
      <div className="">
        <div className="font-medium">{d.subject || "(no subject)"}</div>
        <div className="text-primary text-sm">{d.sender}</div>
        <div className="text-muted-foreground uppercase text-xs tracking-wider">{d.date}</div>
        <div className="mt-2">“{d.quote}”</div>
      </div>
    );
  }
  const w = data as CiteWeb;
  return (
    <div className="">
      <div className="font-medium">{w.title}</div>
      <a
        className="text-primary underline break-words"
        href={w.url}
        target="_blank"
        rel="noreferrer"
      >
        {w.url}
      </a>
      <div className="mt-2 italic">“{w.quote}”</div>
    </div>
  );
}
