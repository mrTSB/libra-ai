import { createServer, IncomingMessage, ServerResponse } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { randomUUID } from 'crypto';
import { createStandaloneServer } from '../server.js';
import { LexiConfig } from '../config.js';

const sessions = new Map<string, { transport: StreamableHTTPServerTransport; server: any }>();

export function startHttpTransport(config: LexiConfig): void {
    const httpServer = createServer();
    
    httpServer.on('request', async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);
        
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
    
    httpServer.listen(config.port, host, () => {
        console.log(`Lexi MCP Server listening on ${config.isProduction ? `Port ${config.port}` : `http://localhost:${config.port}`}`);
        if (!config.isProduction) {
            console.log('Put this in your client config:');
            console.log(JSON.stringify({
                "mcpServers": {
                    "lexi": {
                        "url": `http://localhost:${config.port}/mcp`
                    }
                }
            }, null, 2));
        }
    });
}

async function handleMcpRequest(
    req: IncomingMessage,
    res: ServerResponse,
    config: LexiConfig
): Promise<void> {
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

async function createNewSession(
    req: IncomingMessage,
    res: ServerResponse,
    _config: LexiConfig
): Promise<void> {
    const serverInstance = createStandaloneServer();
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
            sessions.set(sessionId, { transport, server: serverInstance });
            console.log('New Lexi session created:', sessionId);
        }
    });

    transport.onclose = () => {
        if (transport.sessionId) {
            sessions.delete(transport.sessionId);
            console.log('Lexi session closed:', transport.sessionId);
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

async function handleSSERequest(
    _req: IncomingMessage,
    res: ServerResponse,
    _config: LexiConfig
): Promise<void> {
    const serverInstance = createStandaloneServer();
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

function handleHealthCheck(res: ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        service: 'lexi-mcp',
        version: '0.1.0'
    }));
}

function handleNotFound(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
}
