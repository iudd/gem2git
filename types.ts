export enum ModelType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  type: ModelType;
  modelName: string; // e.g., "gpt-4", "dall-e-3", "sora-turbo"
  createdAt: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface GeneratedAsset {
  id: string;
  type: ModelType;
  url: string;
  prompt: string;
  createdAt: number;
  providerId: string;
}

export interface BatchItem {
  prompt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: string; // URL or Text
}
