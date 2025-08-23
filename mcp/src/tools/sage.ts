import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../types.js";

export function registerSageTools(mcp: McpServer, config: Config): void {
  const ChatArgs = {
    prompt: z.string(),
    use_web_search: z.boolean().optional(),
    model_name: z.string().optional(),
    temperature: z.number().optional(),
    stream: z.boolean().optional(),
    chat_id: z.string().optional(),
  } as const;

  mcp.tool("sage.chat", "Chat with Sage.", ChatArgs, async (args) => {
    const isStream = args.stream === true;
    if (isStream) {
      const resp = await fetch(`${config.services.sageUrl}/sage/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: args.prompt,
          use_web_search: args.use_web_search ?? false,
          model_name: args.model_name,
          temperature: args.temperature ?? 0,
          stream: true,
          chat_id: args.chat_id,
        }),
      });
      if (!resp.ok) throw new Error(`Sage stream failed: ${resp.status}`);
      const text = await resp.text();
      return { content: [{ type: "text", text }] } as any;
    }

    const resp = await fetch(`${config.services.sageUrl}/sage/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: args.prompt,
        use_web_search: args.use_web_search ?? false,
        model_name: args.model_name,
        temperature: args.temperature ?? 0,
        stream: false,
        chat_id: args.chat_id,
      }),
    });
    if (!resp.ok) throw new Error(`Sage chat failed: ${resp.status}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });

  const ListArgs = { limit: z.number().int().optional() } as const;
  mcp.tool("sage.list_chats", "List recent chats.", ListArgs, async (args) => {
    const limit = args?.limit ? `?limit=${encodeURIComponent(args.limit)}` : "";
    const resp = await fetch(`${config.services.sageUrl}/sage/get_chats${limit}`);
    if (!resp.ok) throw new Error(`Sage get_chats failed: ${resp.status}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });

  const GetArgs = { chat_id: z.string() } as const;
  mcp.tool("sage.get_chat", "Get a chat by ID.", GetArgs, async (args) => {
    const chatId = encodeURIComponent(args.chat_id);
    const resp = await fetch(`${config.services.sageUrl}/sage/get_chat?chat_id=${chatId}`);
    if (!resp.ok) throw new Error(`Sage get_chat failed: ${resp.status}`);
    const json = await resp.json();
    return { content: [{ type: "text", text: JSON.stringify(json) }] } as any;
  });
}


