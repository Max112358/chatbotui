import { useState, useEffect, useCallback } from "react";
import { Conversation } from "@/types";
import { getConversations, saveConversations } from "@/services/storageService";
import { generateId } from "@/utils/id";

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setConversations(getConversations());
    setIsLoaded(true);
  }, []);

  const persist = useCallback(
    (next: Conversation[] | ((prev: Conversation[]) => Conversation[])) => {
      setConversations((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        saveConversations(value);
        return value;
      });
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

  return {
    conversations,
    isLoaded,
    createConversation,
    updateConversation,
    deleteConversation,
  };
}
