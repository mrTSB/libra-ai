export type LexiChatRequest = {
  question: string;
  use_web_search: boolean;
  use_local_docs: boolean;
  max_local_results: number;
  max_web_results: number;
};

export type LexiSource = Record<string, unknown>;

export type LexiLocalContext = {
  type: "local";
  title: string;
  content: string;
  source: string;
  summary: string | null;
  relevance_score: number | null;
  metadata: {
    chunk_index: number;
    size: number;
    document_path: string;
    start_sentence: number;
  };
};

export type LexiWebContext = {
  type: "web";
  title: string;
  content: string;
  source: string; // URL
  relevance_score: number | null;
};

export type LexiChatResponse = {
  answer: string;
  sources: LexiSource[];
  local_context_used: LexiLocalContext[];
  web_context_used: LexiWebContext[];
  reasoning: string;
};

export async function postLexiChat(body: LexiChatRequest): Promise<LexiChatResponse> {
  const res = await fetch("/api/lexi/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.json();
    } catch {}
    throw new Error(
      `Lexi chat failed: ${res.status} ${res.statusText}` +
        (details ? ` - ${JSON.stringify(details)}` : "")
    );
  }

  return (await res.json()) as LexiChatResponse;
}
