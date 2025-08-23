export interface LegalChatArgs {
    question: string;
    use_web_search?: boolean;
    use_local_docs?: boolean;
    max_local_results?: number;
    max_web_results?: number;
}

export interface LegalChatResponse {
    answer: string;
    sources: Array<{
        type: string;
        title: string;
        content: string;
        source: string;
    }>;
    reasoning?: string;
}
