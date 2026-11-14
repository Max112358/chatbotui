import { useState, useRef } from "react";
import { Message } from "@/types";
import {
  User,
  Bot,
  Pencil,
  Trash2,
  Check,
  X,
  Brain,
  Copy,
  XCircle,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
  message: Message;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
}

export function MessageBubble({
  message,
  onEdit,
  onDelete,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const enableEditing = () => {
    setIsEditing(true);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const submit = () => {
    const value = textareaRef.current?.value ?? "";
    if (value.trim() !== message.content.trim()) {
      onEdit?.(message.id, value.trim());
    }
    setIsEditing(false);
  };

  const cancel = () => {
    if (textareaRef.current) {
      textareaRef.current.value = message.content;
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      cancel();
    }
  };

  const handleCopyReasoning = async () => {
    if (!message.reasoning) return;

    try {
      await navigator.clipboard.writeText(message.reasoning);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`group flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div className="flex max-w-[85%] min-w-0 gap-3 rounded-lg bg-card px-4 py-3 text-main shadow">
        <div className="mt-1 shrink-0">
          {isUser ? (
            <User size={18} />
          ) : (
            <Bot size={18} className="text-accent-orange" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2 break-words">
          {!isEditing ? (
            <>
              {!isUser && message.reasoning && (
                <button
                  onClick={() => setShowReasoning(true)}
                  className="flex w-fit items-center gap-2 rounded-full border border-border-color bg-input px-3 py-1 text-xs text-muted transition-colors hover:border-accent-orange hover:text-accent-orange"
                >
                  <Brain size={12} />
                  <span>Reasoning</span>
                </button>
              )}
              <div className="text-sm">
                <MarkdownRenderer content={message.content} />
              </div>
            </>
          ) : (
            <textarea
              ref={textareaRef}
              defaultValue={message.content}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full resize-y rounded border border-border-color bg-input p-2 text-sm text-main focus:border-accent-orange focus:outline-none"
            />
          )}

          {message.attachments.length > 0 && !isEditing && (
            <div className="space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded border border-border-color bg-input p-2 text-xs"
                >
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.content}
                      alt={attachment.name}
                      className="max-h-48 w-full max-w-full rounded object-contain"
                    />
                  ) : (
                    <details>
                      <summary className="cursor-pointer">
                        {attachment.name}
                      </summary>
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words">
                        {attachment.content.slice(0, 2000)}
                        {attachment.content.length > 2000 && "…"}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          <div
            className={`flex items-center justify-end gap-1 ${
              isEditing
                ? "mt-2 opacity-100"
                : "opacity-0 transition-opacity group-hover:opacity-100"
            }`}
          >
            {isEditing ? (
              <>
                <button
                  onClick={submit}
                  className="rounded p-1 text-success-text hover:bg-success-bg"
                  aria-label="Save edit"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={cancel}
                  className="rounded p-1 text-danger-text hover:bg-danger-bg"
                  aria-label="Cancel edit"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={enableEditing}
                  className="rounded p-1 text-muted hover:bg-card hover:text-main"
                  aria-label="Edit message"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => onDelete?.(message.id)}
                  className="rounded p-1 text-muted hover:bg-danger-bg hover:text-danger-text"
                  aria-label="Delete message"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showReasoning && message.reasoning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReasoning(false);
          }}
        >
          <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg border border-border-color bg-panel shadow-xl">
            <div className="flex items-center justify-between border-b border-border-color px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-accent-orange">
                <Brain size={16} />
                Reasoning
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopyReasoning}
                  className="rounded p-1.5 text-muted hover:bg-card hover:text-main"
                  aria-label="Copy reasoning"
                  title="Copy reasoning"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => setShowReasoning(false)}
                  className="rounded p-1.5 text-muted hover:bg-card hover:text-main"
                  aria-label="Close reasoning"
                  title="Close reasoning"
                >
                  <XCircle size={18} />
                </button>
              </div>
            </div>
            <div className="overflow-auto p-4">
              <pre className="whitespace-pre-wrap break-words text-sm text-muted">
                {message.reasoning}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
