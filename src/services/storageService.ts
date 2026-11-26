import { Conversation, ApiConfig } from "@/types";
import { API_CONFIG_KEY, DEFAULT_CONFIG, STORAGE_KEY } from "@/constants";
import {
  getConversationsFromIndexedDB,
  saveConversationsToIndexedDB,
} from "./indexedDbService";

export type SaveResult = "saved" | "quota-exceeded" | "error";

export async function getConversations(): Promise<Conversation[]> {
  try {
    const fromIDB = await getConversationsFromIndexedDB();
    if (fromIDB.length > 0) {
      return fromIDB;
    }

    // Legacy migration from localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Conversation[];
      await saveConversationsToIndexedDB(parsed);
      return parsed;
    }
    return [];
  } catch (error) {
    console.warn("[storageService] Failed to load conversations:", error);
    return [];
  }
}

export async function saveConversations(
  conversations: readonly Conversation[],
): Promise<SaveResult> {
  const result = await saveConversationsToIndexedDB(conversations);

  if (result === "error") {
    return "error";
  }

  return "saved";
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

export interface StorageEstimate {
  quota: number;
  usage: number;
  percentage: number;
}

export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (!navigator.storage?.estimate) return null;

  try {
    const est = await navigator.storage.estimate();
    const quota = est.quota ?? 0;
    const usage = est.usage ?? 0;
    const percentage =
      quota > 0 ? Math.min(100, Math.round((usage / quota) * 100)) : 0;

    return { quota, usage, percentage };
  } catch {
    return null;
  }
}
