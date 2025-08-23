export type SageChatRequest = {
  prompt: string;
  use_web_search: boolean;
  model_name: string;
  temperature: number;
  stream: boolean;
  chat_id: string;
  title: string;
};

export type SageMessage = {
  role: "user" | "assistant";
  content: string;
};

export type SageChatResponse = {
  chat_id: string;
  title?: string | null;
  messages: SageMessage[];
};

export async function postSageChat(body: SageChatRequest): Promise<SageChatResponse> {
  const res = await fetch("/api/sage/chat", {
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
      `Sage chat failed: ${res.status} ${res.statusText}` +
        (details ? ` - ${JSON.stringify(details)}` : "")
    );
  }

  return (await res.json()) as SageChatResponse;
}

export type SageChatsList = {
  chats: { id: string; title: string }[];
};

export async function fetchSageChats(limit?: number): Promise<SageChatsList> {
  const params = typeof limit === "number" ? `?limit=${encodeURIComponent(limit)}` : "";
  const res = await fetch(`/api/sage/chats${params}`, { cache: "no-store" });
  if (!res.ok) {
    let details: unknown;
    try {
      details = await res.json();
    } catch {}
    throw new Error(
      `Fetch Sage chats failed: ${res.status} ${res.statusText}` +
        (details ? ` - ${JSON.stringify(details)}` : "")
    );
  }
  return (await res.json()) as SageChatsList;
}
