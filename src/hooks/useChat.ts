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
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRef = useRef<{ content: string; reasoning: string }>({
    content: "",
    reasoning: "",
  });

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
        reasoning: "",
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
      pendingRef.current = { content: "", reasoning: "" };

      const flush = () => {
        if (flushTimerRef.current) {
          clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }

        const { content, reasoning } = pendingRef.current;
        if (!content && !reasoning) return;

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

          let nextReasoning = last.reasoning;
          if (reasoning) {
            nextReasoning = (nextReasoning ?? "") + reasoning;
          }

          messages[lastIndex] = {
            ...last,
            content: last.content + content,
            reasoning: nextReasoning,
          };

          return {
            ...c,
            messages,
            updatedAt: Date.now(),
          };
        });

        pendingRef.current = { content: "", reasoning: "" };
      };

      try {
        await streamChatCompletion(
          config.baseUrl,
          messagesForApi,
          config.apiKey,
          model,
          abortRef.current.signal,
          async (chunk) => {
            if (chunk.content) pendingRef.current.content += chunk.content;
            if (chunk.reasoning)
              pendingRef.current.reasoning += chunk.reasoning;

            if (!flushTimerRef.current) {
              flushTimerRef.current = setTimeout(flush, 150);
            }
          },
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          flush();
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
        flush();
        if (flushTimerRef.current) {
          clearTimeout(flushTimerRef.current);
          flushTimerRef.current = null;
        }
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
