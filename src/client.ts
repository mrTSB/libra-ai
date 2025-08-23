import { LexiChatArgs, JurisSearchArgs, LexiChatResponse, JurisSearchResponse } from './types.js';

export class LexiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async chat(params: LexiChatArgs): Promise<LexiChatResponse> {
    const response = await fetch(`${this.baseUrl}/legal/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await safeReadText(response);
      throw new Error(`Lexi API error: ${response.status} ${response.statusText}${text ? `\n${text}` : ''}`);
    }
    return (await response.json()) as LexiChatResponse;
  }
}

export class JurisClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async search(params: JurisSearchArgs): Promise<JurisSearchResponse> {
    const response = await fetch(`${this.baseUrl}/patent/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const text = await safeReadText(response);
      throw new Error(`Juris API error: ${response.status} ${response.statusText}${text ? `\n${text}` : ''}`);
    }
    return (await response.json()) as JurisSearchResponse;
  }
}

async function safeReadText(res: Response): Promise<string | null> {
  try {
    return await res.text();
  } catch {
    return null;
  }
}


