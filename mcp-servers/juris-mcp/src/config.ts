import dotenv from 'dotenv';
dotenv.config();

export interface JurisConfig {
  baseUrl: string; // Patent API base URL
  port: number;
  isProduction: boolean;
}

export function loadConfig(): JurisConfig {
  const baseUrl = process.env.JURIS_BASE_URL;
  if (!baseUrl) {
    throw new Error('JURIS_BASE_URL is required, e.g. http://localhost:8001');
  }
  const port = parseInt(process.env.PORT || '8085', 10);
  const isProduction = process.env.NODE_ENV === 'production';
  return { baseUrl, port, isProduction };
}
