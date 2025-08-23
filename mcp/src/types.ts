export interface Config {
  port: number;
  isProduction: boolean;
  services: {
    lexiUrl: string; // e.g. http://localhost:8000
    jurisUrl: string; // e.g. http://localhost:8001
    sageUrl: string; // e.g. http://localhost:8002
    filoraUrl: string; // e.g. http://localhost:8003
  };
}

// Lexi
export interface LexiChatArgs {
  question: string;
  use_web_search?: boolean;
  use_local_docs?: boolean;
  max_local_results?: number;
  max_web_results?: number;
}

// Juris (patent)
export interface JurisSearchArgs {
  description: string;
  title?: string;
  inventor?: string;
  use_web_search?: boolean;
  use_local_corpus?: boolean;
  max_local_results?: number;
  max_web_results?: number;
}

// Sage
export interface SageChatArgs {
  prompt: string;
  use_web_search?: boolean;
  model_name?: string;
  temperature?: number;
  stream?: boolean;
  chat_id?: string;
}

// Filora
export type FiloraActionType = "fill_form" | "click" | "extract" | "navigate" | "custom";

export interface FiloraActionArgs {
  url: string;
  action_type: FiloraActionType;
  data?: Record<string, unknown>;
  instructions?: string;
  timeout?: number;
}


