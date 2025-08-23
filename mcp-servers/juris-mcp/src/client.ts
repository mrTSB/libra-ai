import { PatentSearchArgs, PatentStatus } from './types.js';

export class JurisClient {
  constructor(private readonly baseUrl: string) {}

  async searchPatents(args: PatentSearchArgs): Promise<any> {
    const res = await fetch(`${this.baseUrl}/patent/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: args.description,
        title: args.title,
        inventor: args.inventor,
        use_web_search: args.use_web_search ?? true,
        use_local_corpus: args.use_local_corpus ?? true,
        max_local_results: args.max_local_results ?? 5,
        max_web_results: args.max_web_results ?? 5
      })
    });
    if (!res.ok) throw new Error(`Juris patent search error: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  async searchLocal(query: string, max_results: number = 5): Promise<any> {
    const url = new URL(`${this.baseUrl}/patent/search-local`);
    url.searchParams.set('query', query);
    url.searchParams.set('max_results', String(max_results));
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Juris local search error: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  async status(): Promise<PatentStatus> {
    const res = await fetch(`${this.baseUrl}/patent/status`);
    if (!res.ok) throw new Error(`Juris status error: ${res.status} ${await res.text()}`);
    return await res.json() as PatentStatus;
  }
}
