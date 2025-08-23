import { LegalChatArgs, LegalChatResponse } from './types.js';

export class LexiClient {
    private backendUrl: string;

    constructor(backendUrl: string = 'http://localhost:8000') {
        this.backendUrl = backendUrl;
    }

    async performLegalChat(args: LegalChatArgs): Promise<LegalChatResponse> {
        const response = await fetch(`${this.backendUrl}/legal/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(args),
        });

        if (!response.ok) {
            let errorText: string;
            try {
                errorText = await response.text();
            } catch {
                errorText = "Unable to parse error response";
            }
            throw new Error(
                `Lexi API error: ${response.status} ${response.statusText}\n${errorText}`
            );
        }

        return await response.json();
    }
}
