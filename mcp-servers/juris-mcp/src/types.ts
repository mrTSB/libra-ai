export interface PatentSearchArgs {
  description: string;
  title?: string;
  inventor?: string;
  use_web_search?: boolean;
  use_local_corpus?: boolean;
  max_local_results?: number;
  max_web_results?: number;
}

export interface PatentStatus {
  patent_corpus_loaded: boolean;
  corpus_chunks: number;
  web_search_available: boolean;
  api_keys_configured: { openai: boolean; exa: boolean };
}
