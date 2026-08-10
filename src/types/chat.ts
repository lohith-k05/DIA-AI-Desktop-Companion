export type MessageRole = "user" | "assistant" | "system";

export type MessageStatus = "complete" | "loading" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  status?: MessageStatus;
  model?: string;
  error?: string;
}

export interface ConversationPayloadMessage {
  role: "user" | "assistant";
  content: string;
}

export interface OllamaModelInfo {
  name: string;
  model: string;
  size?: number;
  digest?: string;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
    format?: string;
    family?: string;
  };
}

export interface OllamaStatusResponse {
  success: boolean;
  connected: boolean;
  models?: OllamaModelInfo[];
  error?: string;
}

export interface ChatApiResponse {
  success: boolean;
  reply?: string;
  model?: string;
  error?: string;
}

export interface ActiveDocument {
  id: string;
  fileName: string;
  pageCount?: number;
  status: 'reading' | 'ready' | 'error';
  errorMessage?: string;
}
