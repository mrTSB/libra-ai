export interface CliOptions {
  port?: number;
  stdio?: boolean;
}

export function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
        if (i + 1 < args.length) {
          options.port = parseInt(args[++i], 10);
        } else {
          throw new Error('--port flag requires a value');
        }
        break;
      case '--stdio':
        options.stdio = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }
  return options;
}

function printHelp(): void {
  console.log(
`Sage MCP Server
USAGE:
    sage-mcp [OPTIONS]
OPTIONS:
    --port <PORT>    Run HTTP server on specified port (default: 8086)
    --stdio          Use STDIO transport instead of HTTP
    --help           Print this help message
ENVIRONMENT VARIABLES:
    SAGE_BASE_URL   Required: Base URL for Python Sage API (e.g., http://localhost:8002)
    PORT            HTTP server port (default: 8086)
    NODE_ENV        Set to 'production' for production mode`
  );
}


