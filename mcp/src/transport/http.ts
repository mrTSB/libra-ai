import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { randomUUID } from "crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import type { Config } from "../types.js";

type Session = { transport: StreamableHTTPServerTransport; server: Server };

const sessions = new Map<string, Session>();

function createStandaloneServer(server: Server): Server {
  return server;
}

export function startHttpTransport(config: Config, server: Server): void {
  const httpServer = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);
      switch (url.pathname) {
        case "/mcp":
          await handleMcpRequest(req, res, config, server);
          break;
        case "/sse":
          await handleSSERequest(req, res, server);
          break;
        case "/health":
          handleHealthCheck(res);
          break;
        default:
          handleNotFound(res);
      }
    } catch (err) {
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  const host = config.isProduction ? "0.0.0.0" : "localhost";
  httpServer.listen(config.port, host, () => {
    logServerStart(config);
  });
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse, config: Config, server: Server): Promise<void> {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      res.statusCode = 404;
      res.end("Session not found");
      return;
    }
    return await session.transport.handleRequest(req, res);
  }

  if (req.method === "POST") {
    await createNewSession(req, res, server);
    return;
  }

  res.statusCode = 400;
  res.end("Invalid request");
}

async function handleSSERequest(req: IncomingMessage, res: ServerResponse, server: Server): Promise<void> {
  const transport = new SSEServerTransport("/mcp", res);
  try {
    await transport.start();
    await server.connect(transport);
  } catch (error) {
    res.statusCode = 500;
    res.end("SSE connection failed");
  }
}

async function createNewSession(req: IncomingMessage, res: ServerResponse, server: Server): Promise<void> {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId: string) => {
      sessions.set(sessionId, { transport, server });
    },
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
    }
  };

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    res.statusCode = 500;
    res.end("Internal server error");
  }
}

function handleHealthCheck(res: ServerResponse): void {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({ status: "healthy", timestamp: new Date().toISOString(), service: "libra-mcp" })
  );
}

function handleNotFound(res: ServerResponse): void {
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
}

function logServerStart(config: Config): void {
  const displayUrl = config.isProduction ? `Port ${config.port}` : `http://localhost:${config.port}`;
  console.log(`Libra MCP Server listening on ${displayUrl}`);
  if (!config.isProduction) {
    console.log("Put this in your client config:");
    console.log(
      JSON.stringify(
        {
          mcpServers: {
            libra: {
              url: `http://localhost:${config.port}/mcp`,
            },
          },
        },
        null,
        2
      )
    );
  }
}


