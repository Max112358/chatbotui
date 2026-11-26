import { useState, useEffect, useCallback, useRef } from "react";
import { Conversation, Message } from "@/types";
import { getConversations, saveConversations } from "@/services/storageService";
import { generateId } from "@/utils/id";

export type StorageMode = "persistent" | "memory-only";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageMode, setStorageMode] = useState<StorageMode>("persistent");

  const storageModeRef = useRef<StorageMode>("persistent");

  useEffect(() => {
    let cancelled = false;

    getConversations()
      .then((loaded) => {
        if (cancelled) return;
        setConversations(loaded);
        setIsLoaded(true);
      })
      .catch((error) => {
        console.warn("[useConversations] Failed to load conversations:", error);
        if (!cancelled) setIsLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Persist to IndexedDB when conversations change, with a short debounce
  useEffect(() => {
    if (!isLoaded) return;
    if (storageModeRef.current === "memory-only") return;

    const timeout = setTimeout(async () => {
      const result = await saveConversations(conversations);

      if (result !== "saved") {
        console.warn(
          `[useConversations] Could not persist conversations (${result}); switching to memory-only mode.`,
        );
        storageModeRef.current = "memory-only";
        setStorageMode("memory-only");
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [conversations, isLoaded]);

  const persist = useCallback(
    (next: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
      setConversations(next);
    },
    [],
  );

  const createConversation = useCallback(
    (model: string): Conversation => {
      const now = Date.now();
      const conversation: Conversation = {
        id: generateId(),
        title: "New conversation",
        messages: [],
        model,
        createdAt: now,
        updatedAt: now,
      };

      persist((prev) => [conversation, ...prev]);
      return conversation;
    },
    [persist],
  );

  const updateConversation = useCallback(
    (id: string, updater: (conversation: Conversation) => Conversation) => {
      persist((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
    },
    [persist],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      persist((prev) => prev.filter((c) => c.id !== id));
    },
    [persist],
  );

  const renameConversation = useCallback(
    (id: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      persist((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c,
        ),
      );
    },
    [persist],
  );

  const updateMessage = useCallback(
    (
      conversationId: string,
      messageId: string,
      updater: (message: Message) => Message,
    ) => {
      persist((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;

          const messages = c.messages.map((m) =>
            m.id === messageId ? updater(m) : m,
          );

          return { ...c, messages, updatedAt: Date.now() };
        }),
      );
    },
    [persist],
  );

  const deleteMessage = useCallback(
    (conversationId: string, messageId: string) => {
      persist((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;

          const messages = c.messages.filter((m) => m.id !== messageId);
          return { ...c, messages, updatedAt: Date.now() };
        }),
      );
    },
    [persist],
  );

  return {
    conversations,
    isLoaded,
    storageMode,
    createConversation,
    updateConversation,
    deleteConversation,
    renameConversation,
    updateMessage,
    deleteMessage,
  };
}
