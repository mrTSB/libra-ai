import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  lexiUrl: string;
  jurisUrl: string;
  port: number;
  isProduction: boolean;
}

export function loadConfig(): Config {
  const lexiUrl = process.env.LEXI_BACKEND_URL || 'http://localhost:8000';
  const jurisUrl = process.env.JURIS_BACKEND_URL || 'http://localhost:8001';

  const port = parseInt(process.env.PORT || '8080', 10);
  const isProduction = process.env.NODE_ENV === 'production';

  return { lexiUrl, jurisUrl, port, isProduction };
}


