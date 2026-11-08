import { useState, useRef, useCallback } from "react";
import { Attachment, ApiConfig } from "@/types";
import { Send, Square, Paperclip } from "lucide-react";
import { processFiles } from "@/services/fileService";
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
  disabled?: boolean;
}

export function MessageInput({
  onSend,
  onStop,
  isStreaming,
  model,
  onModelChange,
  config,
  disabled,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="border-t border-border-color bg-panel p-4">
      <div className="mx-auto max-w-3xl">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded bg-card px-2 py-1 text-xs text-main"
              >
                <span className="max-w-[150px] truncate">
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

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <ModelSelector
            value={model}
            onChange={onModelChange}
            config={config}
            disabled={isStreaming}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading || isStreaming}
            className="rounded bg-button-bg p-2 text-button-text ring-1 ring-button-border transition-colors hover:bg-button-bg-hover disabled:opacity-50"
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

          <textarea
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
            className="max-h-32 flex-1 resize-none rounded border border-border-color bg-input px-3 py-2 text-sm text-main placeholder-muted ring-1 ring-transparent focus:border-accent-orange focus:outline-none focus:ring-accent-orange-hard disabled:opacity-50"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="rounded bg-danger-bg p-2 text-danger-text ring-1 ring-danger-border transition-colors hover:bg-danger-bg-hover"
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
              className="rounded bg-button-bg p-2 text-button-text ring-1 ring-button-border transition-colors hover:bg-button-bg-hover disabled:opacity-50"
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
