import dotenv from 'dotenv';
dotenv.config();

export interface LexiConfig {
    openaiApiKey: string;
    anthropicApiKey: string;
    exaApiKey: string;
    port: number;
    isProduction: boolean;
}

export function loadConfig(): LexiConfig {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    const exaApiKey = process.env.EXA_API_KEY;

    if (!openaiApiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required');
    }
    if (!anthropicApiKey) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    if (!exaApiKey) {
        throw new Error('EXA_API_KEY environment variable is required');
    }

    return {
        openaiApiKey,
        anthropicApiKey,
        exaApiKey,
        port: parseInt(process.env.PORT || '8080', 10),
        isProduction: process.env.NODE_ENV === 'production',
    };
}
