export type ActionType = 'fill_form' | 'click' | 'extract' | 'navigate' | 'custom';

export interface ActionRequestArgs {
  url: string;
  action_type: ActionType;
  data?: Record<string, unknown>;
  instructions?: string;
  timeout?: number;
}

export interface FillFormArgs {
  url: string;
  form_data: Array<{ name: string; value: string; field_type?: string; selector?: string }>;
  submit?: boolean;
}

export interface ClickElementArgs {
  url: string;
  selector: string;
  description?: string;
}

export interface ExtractDataArgs {
  url: string;
  selectors: Record<string, string>;
  instructions?: string;
}

export interface FiloraConfig {
  baseUrl: string;
  port: number;
  isProduction: boolean;
}
