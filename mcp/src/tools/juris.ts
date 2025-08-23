import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../types.js";

export function registerJurisTools(mcp: McpServer, config: Config): void {
  const SearchArgs = {
    description: z.string(),
    title: z.string().optional(),
    inventor: z.string().optional(),
    use_web_search: z.boolean().optional(),
    use_local_corpus: z.boolean().optional(),
    max_local_results: z.number().int().optional(),
    max_web_results: z.number().int().optional(),
  } as const;

  mcp.tool("juris.search_patents", "Search similar patents.", SearchArgs, async (args) => {
    const resp = await fetch(`${config.services.jurisUrl}/patent/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: args.description,
        title: args.title,
        inventor: args.inventor,
        use_web_search: args.use_web_search ?? true,
        use_local_corpus: args.use_local_corpus ?? true,
        max_local_results: args.max_local_results ?? 5,
        max_web_results: args.max_web_results ?? 5,
      }),
    });
    if (!resp.ok) throw new Error(`Juris search failed: ${resp.status} ${await resp.text()}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });

  mcp.tool("juris.status", "Get Juris status.", async () => {
    const resp = await fetch(`${config.services.jurisUrl}/patent/status`);
    if (!resp.ok) throw new Error(`Juris status failed: ${resp.status}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });
}


