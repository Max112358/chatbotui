import { useState, useRef, useCallback } from "react";
import { Attachment, ApiConfig, Conversation, Message } from "@/types";
import { generateId } from "@/utils/id";
import { streamChatCompletion } from "@/services/apiService";

const MAX_TITLE_LENGTH = 40;

function buildTitle(content: string): string {
  const trimmed = content.trim().split("\n")[0];
  return trimmed.length > MAX_TITLE_LENGTH
    ? `${trimmed.slice(0, MAX_TITLE_LENGTH)}...`
    : trimmed || "New conversation";
}

export interface UseChatDependencies {
  conversations: Conversation[];
  config: ApiConfig | null;
  onCreateConversation: (model: string) => Conversation;
  onUpdateConversation: (
    id: string,
    updater: (conversation: Conversation) => Conversation,
  ) => void;
}

export function useChat({
  conversations,
  config,
  onCreateConversation,
  onUpdateConversation,
}: UseChatDependencies) {
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const currentConversation =
    conversations.find((c) => c.id === currentId) ?? null;

  const selectConversation = useCallback((id: string) => {
    setCurrentId(id);
  }, []);

  const createNewConversation = useCallback(
    (model: string) => {
      const conversation = onCreateConversation(model);
      setCurrentId(conversation.id);
      return conversation;
    },
    [onCreateConversation],
  );

  const sendMessage = useCallback(
    async (content: string, attachments: Attachment[], model: string) => {
      if (!config || !config.apiKey) {
        throw new Error("API settings are incomplete");
      }
      if (!content.trim() && attachments.length === 0) return;

      let conversation = currentConversation;
      if (!conversation) {
        conversation = createNewConversation(model);
      }

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: content.trim(),
        attachments,
        createdAt: Date.now(),
      };

      const messagesForApi = [...conversation.messages, userMessage];

      onUpdateConversation(conversation.id, (c) => ({
        ...c,
        title: c.messages.length === 0 ? buildTitle(content) : c.title,
        messages: messagesForApi,
        updatedAt: Date.now(),
      }));

      const assistantMessage: Message = {
        id: generateId(),
        role: "assistant",
        content: "",
        attachments: [],
        createdAt: Date.now(),
      };

      onUpdateConversation(conversation.id, (c) => ({
        ...c,
        messages: [...c.messages, assistantMessage],
        updatedAt: Date.now(),
      }));

      setIsStreaming(true);
      abortRef.current = new AbortController();

      let chunkCount = 0;

      try {
        await streamChatCompletion(
          config.baseUrl,
          messagesForApi,
          config.apiKey,
          model,
          abortRef.current.signal,
          async (chunk) => {
            chunkCount++;

            onUpdateConversation(conversation.id, (c) => {
              const lastIndex = c.messages.length - 1;

              // Only update the last message if it's the placeholder we created
              if (
                lastIndex < 0 ||
                c.messages[lastIndex].id !== assistantMessage.id
              ) {
                return c;
              }

              const messages = [...c.messages];
              const last = messages[lastIndex];

              messages[lastIndex] = {
                ...last,
                content: last.content + chunk,
              };

              return {
                ...c,
                messages,
                updatedAt: Date.now(),
              };
            });

            // Yield to the browser every few chunks so the UI can paint
            if (chunkCount % 8 === 0) {
              await new Promise<void>((resolve) =>
                requestAnimationFrame(() => resolve()),
              );
            }
          },
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        const message =
          error instanceof Error ? error.message : "Unknown error";

        onUpdateConversation(conversation.id, (c) => {
          const lastIndex = c.messages.length - 1;

          if (
            lastIndex < 0 ||
            c.messages[lastIndex].id !== assistantMessage.id
          ) {
            return c;
          }

          const messages = [...c.messages];
          const last = messages[lastIndex];

          messages[lastIndex] = {
            ...last,
            content: `Error: ${message}`,
          };

          return {
            ...c,
            messages,
            updatedAt: Date.now(),
          };
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [config, currentConversation, createNewConversation, onUpdateConversation],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return {
    currentConversation,
    selectConversation,
    createNewConversation,
    sendMessage,
    isStreaming,
    stop,
  };
}
