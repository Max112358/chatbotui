import { ApiConfig } from "@/types";

export const DEFAULT_BASE_URL = "https://api.nano-gpt.com/api/v1";
export const DEFAULT_MODEL = "openai/gpt-6.1-sol";
export const AVAILABLE_MODELS = [DEFAULT_MODEL];

export const DEFAULT_CONFIG: ApiConfig = {
  apiKey: "",
  baseUrl: DEFAULT_BASE_URL,
  model: DEFAULT_MODEL,
};

export const STORAGE_KEY = "nanogpt_conversations";
export const API_CONFIG_KEY = "nanogpt_api_config";
