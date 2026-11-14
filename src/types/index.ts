export type Role = "user" | "assistant" | "system";

export interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ModelInfo {
  id: string;
  object: string;
  context_length?: number;
}

export interface Attachment {
  id: string;
  name: string;
  content: string;
  type: "text" | "image";
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  reasoning?: string;
  attachments: Attachment[];
  createdAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  createdAt: number;
  updatedAt: number;
}
