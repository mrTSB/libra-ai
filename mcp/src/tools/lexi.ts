import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../types.js";

export function registerLexiTools(mcp: McpServer, config: Config): void {
  const ChatArgs = {
    question: z.string(),
    use_web_search: z.boolean().optional(),
    use_local_docs: z.boolean().optional(),
    max_local_results: z.number().int().optional(),
    max_web_results: z.number().int().optional(),
  } as const;

  mcp.tool("lexi.chat", "Ask a legal question using Lexi.", ChatArgs, async (args) => {
    const resp = await fetch(`${config.services.lexiUrl}/legal/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: args.question,
        use_web_search: args.use_web_search ?? true,
        use_local_docs: args.use_local_docs ?? true,
        max_local_results: args.max_local_results ?? 5,
        max_web_results: args.max_web_results ?? 3,
      }),
    });
    if (!resp.ok) throw new Error(`Lexi chat failed: ${resp.status} ${await resp.text()}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });

  mcp.tool("lexi.status", "Get Lexi status.", async () => {
    const resp = await fetch(`${config.services.lexiUrl}/legal/status`);
    if (!resp.ok) throw new Error(`Lexi status failed: ${resp.status}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });

  const SearchArgs = {
    query: z.string(),
    max_results: z.number().int().optional(),
  } as const;

  mcp.tool("lexi.search_local", "Search local legal documents.", SearchArgs, async (args) => {
    const query = encodeURIComponent(args.query);
    const max = args.max_results ? `&max_results=${encodeURIComponent(args.max_results)}` : "";
    const resp = await fetch(`${config.services.lexiUrl}/legal/search?query=${query}${max}`);
    if (!resp.ok) throw new Error(`Lexi search failed: ${resp.status}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });
}


