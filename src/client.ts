import { LexiChatArgs, LexiChatResponse, JurisSearchArgs, JurisSearchResponse, BackendResponse } from './types.js';

export class LibraAIClient {
    private lexiBackendUrl: string;
    private jurisBackendUrl: string;

    constructor(lexiBackendUrl: string, jurisBackendUrl: string) {
        this.lexiBackendUrl = lexiBackendUrl;
        this.jurisBackendUrl = jurisBackendUrl;
    }

    /**
     * Performs legal chat query with Lexi backend
     */
    async performLegalChat(params: LexiChatArgs): Promise<string> {
        const response = await fetch(`${this.lexiBackendUrl}/legal/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            let errorText: string;
            try {
                const errorData: BackendResponse = await response.json();
                errorText = errorData.error || errorData.details?.toString() || 'Unknown error';
            } catch {
                errorText = await response.text() || "Unable to parse error response";
            }
            throw new Error(
                `Lexi backend error: ${response.status} ${response.statusText}\n${errorText}`
            );
        }

        const data: LexiChatResponse = await response.json();
        return this.formatLegalChatResponse(data);
    }

    /**
     * Performs patent search query with Juris backend
     */
    async performPatentSearch(params: JurisSearchArgs): Promise<string> {
        const response = await fetch(`${this.jurisBackendUrl}/patent/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            let errorText: string;
            try {
                const errorData: BackendResponse = await response.json();
                errorText = errorData.error || errorData.details?.toString() || 'Unknown error';
            } catch {
                errorText = await response.text() || "Unable to parse error response";
            }
            throw new Error(
                `Juris backend error: ${response.status} ${response.statusText}\n${errorText}`
            );
        }

        const data: JurisSearchResponse = await response.json();
        return this.formatPatentSearchResponse(data);
    }

    private formatLegalChatResponse(data: LexiChatResponse): string {
        let result = `## Legal Analysis\n\n${data.answer}\n\n`;
        
        if (data.sources && data.sources.length > 0) {
            result += '## Sources\n\n';
            data.sources.forEach((source, index) => {
                result += `**${index + 1}. ${source.title}** (${source.type})\n`;
                if (source.summary) {
                    result += `Summary: ${source.summary}\n`;
                }
                if (source.relevance_score) {
                    result += `Relevance: ${source.relevance_score.toFixed(3)}\n`;
                }
                result += `Source: ${source.source}\n\n`;
            });
        }

        if (data.reasoning) {
            result += `## Search Details\n${data.reasoning}\n`;
        }

        return result;
    }

    private formatPatentSearchResponse(data: JurisSearchResponse): string {
        let result = `## Patent Search Results\n\n`;
        result += `**Query:** ${data.query_description}\n\n`;
        result += `**Summary:** ${data.search_summary}\n\n`;

        if (data.competition_summary) {
            result += `## Competitive Landscape\n\n${data.competition_summary}\n\n`;
        }

        if (data.similar_patents && data.similar_patents.length > 0) {
            result += '## Similar Patents\n\n';
            data.similar_patents.forEach((patent, index) => {
                result += `**${index + 1}. ${patent.title}**\n`;
                result += `Description: ${patent.description}\n`;
                if (patent.patent_number) {
                    result += `Patent Number: ${patent.patent_number}\n`;
                }
                if (patent.inventor) {
                    result += `Inventor: ${patent.inventor}\n`;
                }
                if (patent.filing_date) {
                    result += `Filing Date: ${patent.filing_date}\n`;
                }
                if (patent.similarity_score) {
                    result += `Similarity Score: ${patent.similarity_score.toFixed(3)}\n`;
                }
                result += `Type: ${patent.result_type}\n`;
                result += `Source: ${patent.source}\n\n`;
            });
        }

        if (data.concept_image_url) {
            result += `## Concept Visualization\n\n![Concept Image](${data.concept_image_url})\n\n`;
            if (data.concept_image_prompt) {
                result += `*Image generated with prompt: ${data.concept_image_prompt}*\n\n`;
            }
        }

        return result;
    }
}
