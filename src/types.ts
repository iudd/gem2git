export interface ProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'azure';
  apiKey: string;
  baseUrl?: string;
  model?: string;
  enabled: boolean;
}