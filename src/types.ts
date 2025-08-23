export interface LexiChatArgs {
  question: string;
  use_web_search?: boolean;
  use_local_docs?: boolean;
  max_local_results?: number;
  max_web_results?: number;
}

export interface JurisSearchArgs {
  description: string;
  title?: string | null;
  inventor?: string | null;
  use_web_search?: boolean;
  use_local_corpus?: boolean;
  max_local_results?: number;
  max_web_results?: number;
}

export interface LexiChatResponse {
  answer: string;
  sources?: unknown[];
  local_context_used?: unknown[];
  web_context_used?: unknown[];
  reasoning?: string;
}

export interface JurisSearchResponse {
  query_description: string;
  similar_patents: unknown[];
  local_results_count?: number;
  web_results_count?: number;
  total_results?: number;
  search_summary?: string;
}


