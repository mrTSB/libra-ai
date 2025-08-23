import { ActionRequestArgs, FillFormArgs, ClickElementArgs, ExtractDataArgs } from './types.js';

export class FiloraClient {
  constructor(private readonly baseUrl: string) {}

  async action(args: ActionRequestArgs): Promise<any> {
    const res = await fetch(`${this.baseUrl}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    if (!res.ok) throw new Error(`Filora action error: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  async fillForm(args: FillFormArgs): Promise<any> {
    const res = await fetch(`${this.baseUrl}/fill-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    if (!res.ok) throw new Error(`Filora fill-form error: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  async clickElement(args: ClickElementArgs): Promise<any> {
    const res = await fetch(`${this.baseUrl}/click-element`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    if (!res.ok) throw new Error(`Filora click-element error: ${res.status} ${await res.text()}`);
    return await res.json();
  }

  async extractData(args: ExtractDataArgs): Promise<any> {
    const res = await fetch(`${this.baseUrl}/extract-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(args)
    });
    if (!res.ok) throw new Error(`Filora extract-data error: ${res.status} ${await res.text()}`);
    return await res.json();
  }
}
