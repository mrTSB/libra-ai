import dotenv from 'dotenv';
dotenv.config();

import { SageConfig } from './types.js';

export function loadConfig(): SageConfig {
  const baseUrl = process.env.SAGE_BASE_URL;
  if (!baseUrl) {
    throw new Error('SAGE_BASE_URL is required, e.g. http://localhost:8002');
  }
  const port = parseInt(process.env.PORT || '8086', 10);
  const isProduction = process.env.NODE_ENV === 'production';
  return { baseUrl, port, isProduction };
}

