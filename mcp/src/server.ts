import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { registerAllTools } from "./tools/index.js";
import type { Config } from "./types.js";

export class LibraServer {
  private readonly mcp: McpServer;

  constructor(private readonly config: Config) {
    this.mcp = new McpServer({ name: "libra-mcp", version: "0.1.0" });
    registerAllTools(this.mcp, config);
  }

  getServer(): Server {
    return this.mcp.server;
  }
}


