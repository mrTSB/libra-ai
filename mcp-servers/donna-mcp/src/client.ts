import { DonnaWorkflowArgs } from './types.js';

export class DonnaClient {
  constructor(private readonly baseUrl: string) {}

  async runWorkflow(args: DonnaWorkflowArgs): Promise<string> {
    const res = await fetch(`${this.baseUrl}/donna/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: args.message,
        title: args.title,
        send_email: args.send_email ?? false
      })
    });
    if (!res.ok || !res.body) {
      throw new Error(`Donna workflow error: ${res.status} ${await res.text()}`);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let out = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    return out;
  }
}
