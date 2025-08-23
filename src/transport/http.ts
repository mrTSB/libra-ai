import { createServer, IncomingMessage, ServerResponse } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { randomUUID } from 'crypto';
import { createStandaloneServer } from '../server.js';
import { Config } from '../config.js';

const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: any }>();

export function startHttpTransport(config: Config): void {
  const httpServer = createServer();

  httpServer.on('request', async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    switch (url.pathname) {
      case '/mcp':
        await handleMcpRequest(req, res, config);
        break;
      case '/sse':
        await handleSSERequest(req, res, config);
        break;
      case '/health':
        handleHealthCheck(res);
        break;
      default:
        handleNotFound(res);
    }
  });

  const host = config.isProduction ? '0.0.0.0' : 'localhost';
  httpServer.listen(config.port, host, () => { logServerStart(config); });
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse, config: Config): Promise<void> {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  if (sessionId) {
    const session = sessions.get(sessionId);
    if (!session) {
      res.statusCode = 404;
      res.end('Session not found');
      return;
    }
    return await session.transport.handleRequest(req, res);
  }

  if (req.method === 'POST') {
    await createNewSession(req, res, config);
    return;
  }
  res.statusCode = 400;
  res.end('Invalid request');
}

async function handleSSERequest(_req: IncomingMessage, res: ServerResponse, config: Config): Promise<void> {
  const serverInstance = createStandaloneServer(config);
  const transport = new SSEServerTransport('/sse', res);
  try {
    await serverInstance.connect(transport);
    console.log('SSE connection established');
  } catch (error) {
    console.error('SSE connection error:', error);
    res.statusCode = 500;
    res.end('SSE connection failed');
  }
}

async function createNewSession(req: IncomingMessage, res: ServerResponse, config: Config): Promise<void> {
  const serverInstance = createStandaloneServer(config);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, { transport, server: serverInstance });
      console.log('New Libra session created:', id);
    }
  });

  transport.onclose = () => {
    if (transport.sessionId) {
      sessions.delete(transport.sessionId);
      console.log('Libra session closed:', transport.sessionId);
    }
  };

  try {
    await serverInstance.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Streamable HTTP connection error:', error);
    res.statusCode = 500;
    res.end('Internal server error');
  }
}

function handleHealthCheck(res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString(), service: 'libra-mcp', version: '0.2.0' }));
}

function handleNotFound(res: ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

function logServerStart(config: Config): void {
  const displayUrl = config.isProduction ? `Port ${config.port}` : `http://localhost:${config.port}`;
  console.log(`Libra MCP Server listening on ${displayUrl}`);
  if (!config.isProduction) {
    console.log('Put this in your client config:');
    console.log(JSON.stringify({ mcpServers: { libra: { url: `http://localhost:${config.port}/mcp` } } }, null, 2));
    console.log('For backward compatibility, you can also use the /sse endpoint.');
  }
}


