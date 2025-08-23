import dotenv from "dotenv";
dotenv.config();

import type { Config } from "./types.js";

export function loadConfig(): Config {
  const port = parseInt(process.env.PORT || "8080", 10);
  const isProduction = process.env.NODE_ENV === "production";

  const lexiUrl = process.env.LEXI_URL || "http://localhost:8000";
  const jurisUrl = process.env.JURIS_URL || "http://localhost:8001";
  const sageUrl = process.env.SAGE_URL || "http://localhost:8002";
  const filoraUrl = process.env.FILORA_URL || "http://localhost:8003";

  return {
    port,
    isProduction,
    services: { lexiUrl, jurisUrl, sageUrl, filoraUrl },
  };
}


