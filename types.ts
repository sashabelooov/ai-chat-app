export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  images?: string[]; // Base64 strings
  isError?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  date: string;
  messages: Message[];
}

export interface ModelConfig {
  modelName: string;
  displayName: string;
  isThinkingSupported: boolean;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  { modelName: 'bigram-local', displayName: 'Local Bigram Model', isThinkingSupported: false },
  { modelName: 'bigram-local-large', displayName: 'Local Bigram (Large)', isThinkingSupported: false },
];