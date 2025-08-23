import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Config } from "../types.js";
import { registerLexiTools } from "./lexi.js";
import { registerJurisTools } from "./juris.js";
import { registerSageTools } from "./sage.js";
import { registerFiloraTools } from "./filora.js";

export function registerAllTools(mcp: McpServer, config: Config): void {
  registerLexiTools(mcp, config);
  registerJurisTools(mcp, config);
  registerSageTools(mcp, config);
  registerFiloraTools(mcp, config);
}


