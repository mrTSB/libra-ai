#!/usr/bin/env node

import { config as loadEnv } from 'dotenv';
loadEnv();

import { loadConfig } from './config.js';
import { parseArgs } from './cli.js';
import { LibraServer } from './server.js';
import { runStdioTransport, startHttpTransport } from './transport/index.js';

async function main() {
  try {
    const config = loadConfig();
    const cliOptions = parseArgs();

    if (cliOptions.stdio) {
      const server = new LibraServer(config);
      await runStdioTransport(server.getServer());
    } else {
      const port = cliOptions.port || config.port;
      startHttpTransport({ ...config, port });
    }
  } catch (error) {
    console.error('Fatal error running Libra MCP server:', error);
    process.exit(1);
  }
}

main();


