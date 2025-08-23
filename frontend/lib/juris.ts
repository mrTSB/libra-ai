export type JurisSearchRequest = {
  description: string;
  title?: string | null;
  inventor?: string | null;
  use_web_search: boolean;
  use_local_corpus: boolean;
  max_local_results: number;
  max_web_results: number;
};

export type JurisPatentResult = {
  title: string;
  description: string;
  source: string;
  similarity_score: number | null;
  patent_number?: string | null;
  filing_date?: string | null;
  inventor?: string | null;
  assignee?: string | null;
  result_type: string; // 'local_corpus' | 'web_search'
};

export type JurisSearchResponse = {
  query_description: string;
  similar_patents: JurisPatentResult[];
  local_results_count: number;
  web_results_count: number;
  total_results: number;
  search_summary: string;
};

export async function postJurisSearch(body: JurisSearchRequest): Promise<JurisSearchResponse> {
  const res = await fetch("/api/juris/search", {
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
      `Juris search failed: ${res.status} ${res.statusText}` +
        (details ? ` - ${JSON.stringify(details)}` : "")
    );
  }

  return (await res.json()) as JurisSearchResponse;
}
