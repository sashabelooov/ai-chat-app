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
  { modelName: 'tinyllama-1.1b', displayName: 'TinyLlama 1.1B', isThinkingSupported: false },
];