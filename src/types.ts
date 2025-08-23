/**
 * TypeScript interfaces for Libra AI MCP server
 */

// Lexi Legal Chat Types
export interface LexiChatArgs {
    question: string;
    use_web_search?: boolean;
    use_local_docs?: boolean;
    max_local_results?: number;
    max_web_results?: number;
}

export interface LexiSource {
    type: "local" | "web";
    title: string;
    content: string;
    source: string;
    relevance_score?: number;
    summary?: string;
    metadata?: Record<string, unknown>;
}

export interface LexiChatResponse {
    answer: string;
    sources: LexiSource[];
    local_context_used: LexiSource[];
    web_context_used: LexiSource[];
    reasoning?: string;
}

// Juris Patent Search Types
export interface JurisSearchArgs {
    description: string;
    title?: string;
    inventor?: string;
    use_web_search?: boolean;
    use_local_corpus?: boolean;
    max_local_results?: number;
    max_web_results?: number;
}

export interface PatentResult {
    title: string;
    description: string;
    source: string;
    similarity_score?: number;
    patent_number?: string;
    filing_date?: string;
    inventor?: string;
    assignee?: string;
    result_type: "local_corpus" | "web_search";
}

export interface JurisSearchResponse {
    query_description: string;
    similar_patents: PatentResult[];
    local_results_count: number;
    web_results_count: number;
    total_results: number;
    search_summary: string;
    competition_summary?: string;
    concept_image_url?: string;
    concept_image_prompt?: string;
}

// Backend API Response Types
export interface BackendResponse {
    data?: unknown;
    error?: string;
    details?: unknown;
}

// Configuration Types
export interface Config {
    lexiBackendUrl: string;
    jurisBackendUrl: string;
    port: number;
    isProduction: boolean;
}
