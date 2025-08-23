import dotenv from 'dotenv';
import { Config } from './types.js';
dotenv.config();

export function loadConfig(): Config {
    const lexiBackendUrl = process.env.LEXI_BACKEND_URL || 'http://localhost:8000';
    const jurisBackendUrl = process.env.JURIS_BACKEND_URL || 'http://localhost:8001';
    const port = parseInt(process.env.PORT || '8080', 10);
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        lexiBackendUrl,
        jurisBackendUrl,
        port,
        isProduction,
    };
}
