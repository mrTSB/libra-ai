import dotenv from 'dotenv';
dotenv.config();

import { FiloraConfig } from './types.js';

export function loadConfig(): FiloraConfig {
  const baseUrl = process.env.FILORA_BASE_URL;
  if (!baseUrl) {
    throw new Error('FILORA_BASE_URL is required, e.g. http://localhost:8003');
  }
  const port = parseInt(process.env.PORT || '8087', 10);
  const isProduction = process.env.NODE_ENV === 'production';
  return { baseUrl, port, isProduction };
}
