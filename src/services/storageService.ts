import { Conversation, ApiConfig } from "@/types";
import { API_CONFIG_KEY, DEFAULT_CONFIG, STORAGE_KEY } from "@/constants";

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" ||
      error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  );
}

function pruneOldest(conversations: readonly Conversation[]): Conversation[] {
  if (conversations.length <= 1) {
    return [...conversations];
  }

  const oldestId = conversations.reduce((oldest, current) =>
    current.updatedAt < oldest.updatedAt ? current : oldest,
  ).id;

  return conversations.filter((c) => c.id !== oldestId);
}

export function getConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Conversation[]) : [];
  } catch {
    return [];
  }
}

export function saveConversations(
  conversations: readonly Conversation[],
): void {
  let remaining = [...conversations];

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      return;
    } catch (error) {
      if (isQuotaError(error) && remaining.length > 0) {
        remaining = pruneOldest(remaining);
      } else {
        throw error;
      }
    }
  }

  throw new Error("Unable to save conversations within storage quota");
}

export function getApiConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem(API_CONFIG_KEY);
    if (!raw) return null;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) } as ApiConfig;
  } catch {
    return null;
  }
}

export function setApiConfig(config: ApiConfig): void {
  localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
}
