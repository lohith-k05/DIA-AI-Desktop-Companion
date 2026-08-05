import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  OLLAMA_URL: process.env.OLLAMA_BASE_URL || process.env.OLLAMA_URL || "http://127.0.0.1:11434",
  DEFAULT_MODEL: process.env.OLLAMA_MODEL || "gemma3:1b",
  MAX_MESSAGE_LENGTH: 6000,
  MAX_CONVERSATION_MESSAGES: Number(process.env.OLLAMA_CONTEXT_LIMIT) || 14,
  DEFAULT_TEMPERATURE: Number(process.env.OLLAMA_TEMPERATURE) || 0.4,
  MAX_OUTPUT_TOKENS: Number(process.env.OLLAMA_MAX_TOKENS) || 2048,
  REQUEST_TIMEOUT_MS: Number(process.env.REQUEST_TIMEOUT_MS) || 60000,
};
