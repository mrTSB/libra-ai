#!/usr/bin/env node

import { fileURLToPath } from "url";
import { createRequire } from "module";

// Defer to the MCP server inside mcp/dist
const require = createRequire(import.meta.url);
const path = require("path");
const mcpDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../mcp/dist/index.js");

// eslint-disable-next-line @typescript-eslint/no-var-requires
require(mcpDist);


