import dotenv from 'dotenv';
dotenv.config();

import { DonnaConfig } from './types.js';

export function loadConfig(): DonnaConfig {
  const baseUrl = process.env.DONNA_BASE_URL;
  if (!baseUrl) {
    throw new Error('DONNA_BASE_URL is required, e.g. http://localhost:8003');
  }
  const port = parseInt(process.env.PORT || '8088', 10);
  const isProduction = process.env.NODE_ENV === 'production';
  return { baseUrl, port, isProduction };
}
