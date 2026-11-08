import { ApiConfig } from "@/types";

export const DEFAULT_BASE_URL = "https://api.nano-gpt.com/api/v1";

export const DEFAULT_MODEL = "moonshotai/kimi-k2.7-code";

export const AVAILABLE_MODELS = [
  "moonshotai/kimi-k2.7-code",
  "z-ai/glm-5.3:thinking",
  "xaiomi/mimo-v2.6-pro",
];

export const MODEL_CONTEXT_LENGTHS: Record<string, number> = {
  "moonshotai/kimi-k2.7-code": 256000,
  "z-ai/glm-5.3:thinking": 128000,
  "xaiomi/mimo-v2.6-pro": 128000,
};

export const DEFAULT_CONFIG: ApiConfig = {
  apiKey: "",
  baseUrl: DEFAULT_BASE_URL,
  model: DEFAULT_MODEL,
};

export const STORAGE_KEY = "nanogpt_conversations";
export const API_CONFIG_KEY = "nanogpt_api_config";
