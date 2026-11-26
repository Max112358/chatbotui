import { openDB, DBSchema, IDBPDatabase } from "idb";
import { Conversation } from "@/types";

const DB_NAME = "NanoGPTChatDB";
const DB_VERSION = 1;
const CONVERSATIONS_STORE = "conversations";

interface NanoGPTDB extends DBSchema {
  [CONVERSATIONS_STORE]: {
    key: string;
    value: Conversation;
  };
}

let dbPromise: Promise<IDBPDatabase<NanoGPTDB>> | null = null;

function getDB(): Promise<IDBPDatabase<NanoGPTDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NanoGPTDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          db.createObjectStore(CONVERSATIONS_STORE, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function getConversationsFromIndexedDB(): Promise<Conversation[]> {
  try {
    const db = await getDB();
    return await db.getAll(CONVERSATIONS_STORE);
  } catch (error) {
    console.warn("[indexedDbService] Failed to load conversations:", error);
    return [];
  }
}

export async function saveConversationsToIndexedDB(
  conversations: readonly Conversation[],
): Promise<"saved" | "error"> {
  try {
    const db = await getDB();
    const tx = db.transaction(CONVERSATIONS_STORE, "readwrite");
    const store = tx.objectStore(CONVERSATIONS_STORE);

    await store.clear();

    for (const conversation of conversations) {
      await store.put(conversation);
    }

    await tx.done;
    return "saved";
  } catch (error) {
    console.warn("[indexedDbService] Failed to save conversations:", error);
    return "error";
  }
}

export async function deleteConversationFromIndexedDB(
  id: string,
): Promise<void> {
  try {
    const db = await getDB();
    await db.delete(CONVERSATIONS_STORE, id);
  } catch {
    // ignore
  }
}

export function resetDbPromise(): void {
  dbPromise = null;
}
