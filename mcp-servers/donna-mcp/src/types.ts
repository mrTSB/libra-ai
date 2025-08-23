export interface DonnaWorkflowArgs {
  message: string;
  title: string;
  send_email?: boolean;
}

export interface DonnaConfig {
  baseUrl: string;
  port: number;
  isProduction: boolean;
}
