import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Attachment, ApiConfig, Conversation, ModelInfo } from "@/types";
import { Send, Square, Paperclip } from "lucide-react";
import { processFiles } from "@/services/fileService";
import { estimateTokens } from "@/utils/tokens";
import { ModelSelector } from "./ModelSelector";

interface MessageInputProps {
  onSend: (
    content: string,
    attachments: Attachment[],
    model: string,
  ) => void | Promise<void>;
  onStop: () => void;
  isStreaming: boolean;
  model: string;
  onModelChange: (model: string) => void;
  config: ApiConfig | null;
  currentConversation: Conversation | null;
  selectedModelInfo?: ModelInfo;
  modelInfos?: ModelInfo[];
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onStop,
  isStreaming,
  model,
  onModelChange,
  config,
  currentConversation,
  selectedModelInfo,
  modelInfos,
  disabled,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isStreaming || disabled) return;
      await onSend(content, attachments, model);
      setContent("");
      setAttachments([]);
    },
    [content, attachments, model, onSend, isStreaming, disabled],
  );

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
        const processed = await processFiles(files);
        setAttachments((prev) => [...prev, ...processed]);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    const maxHeight = window.innerHeight * 0.5;

    el.style.height = "auto";
    el.style.maxHeight = `${maxHeight}px`;

    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
  }, [content]);

  const contextUsage = useMemo(() => {
    if (!currentConversation || !selectedModelInfo?.context_length) {
      return null;
    }

    let used = 0;

    for (const message of currentConversation.messages) {
      used += estimateTokens(message.content);
      for (const attachment of message.attachments) {
        used += estimateTokens(attachment.content);
      }
    }

    used += estimateTokens(content);
    for (const attachment of attachments) {
      used += estimateTokens(attachment.content);
    }

    const total = selectedModelInfo.context_length;
    const percentage = Math.min(100, Math.round((used / total) * 100));

    return { used, total, percentage };
  }, [selectedModelInfo, currentConversation, content, attachments]);

  return (
    <div className="min-w-0 border-t border-border-color bg-panel p-4">
      <div className="mx-auto w-full max-w-3xl">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded bg-card px-2 py-1 text-xs text-main"
              >
                <span className="max-w-[120px] truncate sm:max-w-[150px]">
                  {attachment.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-muted hover:text-danger-text"
                  aria-label={`Remove ${attachment.name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e);
              }
            }}
            placeholder={
              disabled ? "Set an API key to chat" : "Message NanoGPT…"
            }
            disabled={disabled || isStreaming}
            rows={1}
            className="max-h-[50vh] min-h-[40px] w-full resize-none overflow-y-auto rounded border border-border-color bg-input px-3 py-2 text-sm text-main placeholder-muted ring-1 ring-transparent focus:border-accent-orange focus:outline-none focus:ring-accent-orange-hard disabled:opacity-50"
          />

          <div className="flex flex-wrap items-center gap-2">
            <ModelSelector
              value={model}
              onChange={onModelChange}
              config={config}
              disabled={isStreaming}
              modelInfos={modelInfos}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isUploading || isStreaming}
              className="shrink-0 rounded bg-button-bg p-2 text-button-text ring-1 ring-button-border transition-colors hover:bg-button-bg-hover disabled:opacity-50"
              aria-label="Attach file"
            >
              <Paperclip size={20} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex-1" />

            {contextUsage ? (
              <div
                className="flex flex-col items-end px-2"
                title={`Estimated tokens: ${contextUsage.used.toLocaleString()} / ${contextUsage.total.toLocaleString()}`}
              >
                <span
                  className={`text-xs font-medium ${
                    contextUsage.percentage > 80
                      ? "text-danger-text"
                      : contextUsage.percentage > 50
                        ? "text-accent-orange"
                        : "text-muted"
                  }`}
                >
                  {contextUsage.percentage}%
                </span>
                <span className="text-[10px] text-muted">context</span>
              </div>
            ) : (
              <div
                className="flex flex-col items-end px-2"
                title="No context_length from API for this model"
              >
                <span className="text-xs font-medium text-muted">--</span>
                <span className="text-[10px] text-muted">context</span>
              </div>
            )}

            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="shrink-0 rounded bg-danger-bg p-2 text-danger-text ring-1 ring-danger-border transition-colors hover:bg-danger-bg-hover"
                aria-label="Stop generation"
              >
                <Square size={20} fill="currentColor" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={
                  disabled ||
                  isUploading ||
                  (!content.trim() && attachments.length === 0)
                }
                className="shrink-0 rounded bg-button-bg p-2 text-button-text ring-1 ring-button-border transition-colors hover:bg-button-bg-hover disabled:opacity-50"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
