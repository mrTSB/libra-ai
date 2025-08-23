export interface SageChatArgs {
  prompt: string;
  use_web_search?: boolean;
  model_name?: string;
  temperature?: number;
  chat_id?: string;
}

export interface SageChatsList {
  chats: Array<{ id: string; title: string }>;
}

export interface SageChatDetail {
  chat_id: string;
  title: string | null;
  messages: Array<{ role: string; content: string }>;
}

export interface SageConfig {
  baseUrl: string;
  port: number;
  isProduction: boolean;
}

