# Libra AI MCP Server

An MCP (Model Context Protocol) server that provides access to Libra AI's legal and patent search capabilities. This server exposes two main tools for AI assistants to interact with legal documents and patent databases.

## Features

- **Legal Chat (Lexi)**: Ask legal questions and get comprehensive answers using both local legal documents and web search
- **Patent Search (Juris)**: Search for similar patents using local patent corpus and web search with competitive analysis
- **Streamable HTTP Transport**: Modern HTTP transport compatible with Dedalus platform
- **STDIO Transport**: Development-friendly STDIO transport for local testing

## Quick Start

### Prerequisites

- Node.js 18+ 
- pnpm (preferred) or npm
- Access to Lexi (legal) and Juris (patent) backend services

### Installation

```bash
# Install dependencies
pnpm install

# Build the server
pnpm run build

# Start the server (HTTP transport)
pnpm start

# Or start with STDIO transport for development
pnpm run start:stdio
```

### Development

```bash
# Watch mode (rebuilds on changes)
pnpm run watch

# Development with HTTP transport
pnpm run dev

# Development with STDIO transport
pnpm run dev:stdio
```

## Configuration

The server can be configured using environment variables:

```bash
# Backend service URLs
LEXI_BACKEND_URL=http://localhost:8000      # Legal chat backend
JURIS_BACKEND_URL=http://localhost:8001     # Patent search backend

# Server configuration
PORT=8080                                   # HTTP server port
NODE_ENV=production                         # Environment mode
```

## Available Tools

### 1. lexi_legal_chat

Ask legal questions and get comprehensive answers using both local legal documents and web search.

**Parameters:**
- `question` (required): The legal question to ask
- `use_web_search` (optional): Include web search results (default: true)
- `use_local_docs` (optional): Search local legal documents (default: true) 
- `max_local_results` (optional): Max local document results (default: 5)
- `max_web_results` (optional): Max web search results (default: 3)

**Example:**
```json
{
  "question": "What are the requirements for filing a trademark application?",
  "use_web_search": true,
  "use_local_docs": true,
  "max_local_results": 5,
  "max_web_results": 3
}
```

### 2. juris_patent_search

Search for patents similar to a given description using both local patent corpus and web search.

**Parameters:**
- `description` (required): Description of the patent/invention to search for
- `title` (optional): Title of the patent/invention
- `inventor` (optional): Inventor name
- `use_web_search` (optional): Include web search (default: true)
- `use_local_corpus` (optional): Search local patent corpus (default: true)
- `max_local_results` (optional): Max local corpus results (default: 5)
- `max_web_results` (optional): Max web search results (default: 5)

**Example:**
```json
{
  "description": "A machine learning system for predicting stock prices using sentiment analysis",
  "title": "AI-Powered Financial Prediction System",
  "use_web_search": true,
  "use_local_corpus": true,
  "max_local_results": 5,
  "max_web_results": 5
}
```

## Transport Methods

### HTTP Transport (Default)

The server runs on HTTP by default, providing modern streamable transport compatible with cloud platforms like Dedalus.

```bash
# Start HTTP server
node dist/index.js

# Custom port
node dist/index.js --port 9000
```

**Client Configuration:**
```json
{
  "mcpServers": {
    "libra-ai": {
      "url": "http://localhost:8080/mcp"
    }
  }
}
```

### STDIO Transport

For local development and testing:

```bash
# Start STDIO transport
node dist/index.js --stdio
```

## API Endpoints

When running in HTTP mode, the server provides these endpoints:

- `GET /health` - Health check endpoint
- `POST /mcp` - Main MCP protocol endpoint
- `GET /sse` - Server-Sent Events endpoint (backward compatibility)

## Integration with Dedalus

This server is designed to work with the Dedalus platform. Dedalus will:

1. Load the full repository from your MCP branch
2. Install dependencies using `pnpm install`
3. Build the server using `pnpm run build`
4. Start the server using the compiled `dist/index.js`
5. Expose the tools publicly on their platform

The server follows Dedalus MCP server guidelines:
- ✅ TypeScript server with `src/index.ts` entry point
- ✅ Streamable HTTP transport as primary method
- ✅ Stateless design (no authentication required)
- ✅ Proper error handling and logging
- ✅ Health check endpoints

## Backend Services

This MCP server acts as a proxy to the existing Libra AI backend services:

- **Lexi (Legal)**: Runs on port 8000, provides legal document search and chat
- **Juris (Patent)**: Runs on port 8001, provides patent similarity search and analysis

Make sure both backend services are running before starting the MCP server.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AI Assistant  │◄──►│  MCP Server     │◄──►│ Backend APIs    │
│                 │    │  (This Service) │    │ (Lexi & Juris)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Troubleshooting

### Server won't start
1. Check that required backend services are running
2. Verify environment variables are set correctly
3. Ensure the port is not already in use

### Tools return errors
1. Verify backend service URLs are correct
2. Check that backend services are healthy
3. Review server logs for detailed error messages

### Permission denied errors
1. Ensure files are executable: `chmod +x dist/*.js`
2. Try rebuilding: `pnpm run build`

## License

MIT
