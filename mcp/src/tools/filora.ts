import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../types.js";

export function registerFiloraTools(mcp: McpServer, config: Config): void {
  const ActionArgs = {
    url: z.string().url(),
    action_type: z.enum(["fill_form", "click", "extract", "navigate", "custom"]),
    data: z.record(z.unknown()).optional(),
    instructions: z.string().optional(),
    timeout: z.number().int().optional(),
  } as const;

  mcp.tool("filora.action", "Execute a Filora browser action.", ActionArgs, async (args) => {
    const resp = await fetch(`${config.services.filoraUrl}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: args.url,
        action_type: args.action_type,
        data: args.data ?? {},
        instructions: args.instructions,
        timeout: args.timeout ?? 30,
      }),
    });
    if (!resp.ok) throw new Error(`Filora action failed: ${resp.status}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });

  mcp.tool("filora.health", "Check Filora health.", async () => {
    const resp = await fetch(`${config.services.filoraUrl}/health`);
    if (!resp.ok) throw new Error(`Filora health failed: ${resp.status}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });
}


