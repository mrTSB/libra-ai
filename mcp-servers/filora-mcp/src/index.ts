#!/usr/bin/env node
import { config as loadEnv } from 'dotenv';
loadEnv();
import { loadConfig } from './config.js';
import { parseArgs } from './cli.js';
import { FiloraServer } from './server.js';
import { runStdioTransport, startHttpTransport } from './transport/index.js';

async function main() {
  try {
    const config = loadConfig();
    const cli = parseArgs();

    if (cli.stdio) {
      const server = new FiloraServer(config.baseUrl);
      await runStdioTransport(server.getServer());
    } else {
      const port = cli.port || config.port;
      startHttpTransport({ ...config, port });
    }
  } catch (err) {
    console.error('Fatal error running Filora server:', err);
    process.exit(1);
  }
}
main();
