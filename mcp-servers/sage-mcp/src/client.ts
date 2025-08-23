import { SageChatArgs, SageChatsList, SageChatDetail } from './types.js';

export class SageClient {
  constructor(private readonly baseUrl: string) {}

  async chat(args: SageChatArgs): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sage/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: args.prompt,
        use_web_search: args.use_web_search ?? false,
        model_name: args.model_name,
        temperature: args.temperature,
        stream: false,
        chat_id: args.chat_id
      })
    });
    if (!res.ok) throw new Error(`Sage chat error: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  async listChats(limit?: number): Promise<SageChatsList> {
    const url = new URL(`${this.baseUrl}/sage/get_chats`);
    if (typeof limit === 'number') url.searchParams.set('limit', String(limit));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sage get_chats error: ${res.status} ${await res.text()}`);
    return await res.json() as SageChatsList;
  }

  async getChat(chatId: string): Promise<SageChatDetail> {
    const url = new URL(`${this.baseUrl}/sage/get_chat`);
    url.searchParams.set('chat_id', chatId);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Sage get_chat error: ${res.status} ${await res.text()}`);
    return await res.json() as SageChatDetail;
  }
}

