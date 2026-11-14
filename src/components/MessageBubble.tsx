import { useState, useRef, useEffect, memo } from "react";
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
  AlertTriangle,
} from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

function useAutoResizeTextarea(
  ref: React.RefObject<HTMLTextAreaElement>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;

    const el = ref.current;
    if (!el) return;

    const resize = () => {
      const maxHeight = window.innerHeight * 0.5;
      el.style.height = "auto";
      el.style.maxHeight = `${maxHeight}px`;
      el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    };

    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      resize();
    });

    el.addEventListener("input", resize);
    window.addEventListener("resize", resize);

    return () => {
      el.removeEventListener("input", resize);
      window.removeEventListener("resize", resize);
    };
  }, [active, ref]);
}

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onEdit?: (id: string, content: string) => void;
  onEditReasoning?: (id: string, reasoning: string) => void;
  onDelete?: (id: string) => void;
}

function MessageBubbleInternal({
  message,
  isStreaming = false,
  onEdit,
  onEditReasoning,
  onDelete,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingReasoning, setIsEditingReasoning] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const reasoningTextareaRef = useRef<HTMLTextAreaElement>(null);

  useAutoResizeTextarea(textareaRef, isEditing);
  useAutoResizeTextarea(reasoningTextareaRef, isEditingReasoning);

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

  const submitReasoning = () => {
    const value = reasoningTextareaRef.current?.value ?? "";
    const current = message.reasoning ?? "";
    if (value.trim() !== current.trim()) {
      onEditReasoning?.(message.id, value.trim());
    }
    setIsEditingReasoning(false);
  };

  const cancelReasoning = () => {
    if (reasoningTextareaRef.current) {
      reasoningTextareaRef.current.value = message.reasoning ?? "";
    }
    setIsEditingReasoning(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      cancel();
    }
  };

  const handleReasoningKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault();
      submitReasoning();
    } else if (e.key === "Escape") {
      cancelReasoning();
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

  const confirmDelete = () => {
    onDelete?.(message.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className={`group flex gap-4 ${
          isUser ? "justify-end" : "justify-start"
        }`}
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
            {!isUser && (
              <button
                onClick={() => setShowReasoning(true)}
                className="flex w-fit items-center gap-2 rounded-full border border-border-color bg-input px-3 py-1 text-xs text-muted transition-colors hover:border-accent-orange hover:text-accent-orange"
              >
                <Brain size={12} />
                <span>
                  {message.reasoning ? "Reasoning" : "Reasoning (empty)"}
                </span>
              </button>
            )}
            <div className="text-sm">
              {isStreaming ? (
                <div className="whitespace-pre-wrap">{message.content}</div>
              ) : (
                <MarkdownRenderer content={message.content} />
              )}
            </div>

            {message.attachments.length > 0 && (
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

            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                onClick={() => setIsEditing(true)}
                className="rounded p-1 text-muted hover:bg-card hover:text-main"
                aria-label="Edit message"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded p-1 text-muted hover:bg-danger-bg hover:text-danger-text"
                aria-label="Delete message"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDeleteConfirm(false);
          }}
        >
          <div className="w-full max-w-sm rounded-lg border border-border-color bg-panel p-5 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="shrink-0 rounded-full bg-danger-bg p-2 text-danger-text">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-main">
                  Delete {isUser ? "your" : "AI"} message?
                </h3>
                <p className="mt-1 text-sm text-muted">
                  This message will be permanently removed. This cannot be
                  undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded bg-card px-4 py-2 text-sm font-medium text-main ring-1 ring-border-color transition-colors hover:bg-input"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded bg-danger-bg px-4 py-2 text-sm font-medium text-danger-text ring-1 ring-danger-border transition-colors hover:bg-danger-bg-hover"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showReasoning && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowReasoning(false);
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg border border-border-color bg-panel shadow-xl">
            {!isEditingReasoning ? (
              <>
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
                      onClick={() => setIsEditingReasoning(true)}
                      className="rounded p-1.5 text-muted hover:bg-card hover:text-main"
                      aria-label="Edit reasoning"
                      title="Edit reasoning"
                    >
                      <Pencil size={16} />
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
                    {message.reasoning || (
                      <span className="italic opacity-60">
                        No reasoning recorded for this message.
                      </span>
                    )}
                  </pre>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-border-color px-4 py-3">
                  <div className="text-sm font-semibold text-accent-orange">
                    Edit Reasoning
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={submitReasoning}
                      className="rounded p-1.5 text-success-text hover:bg-success-bg"
                      aria-label="Save reasoning"
                      title="Save reasoning (Ctrl + Enter)"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={cancelReasoning}
                      className="rounded p-1.5 text-danger-text hover:bg-danger-bg"
                      aria-label="Cancel reasoning edit"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4">
                  <textarea
                    ref={reasoningTextareaRef}
                    defaultValue={message.reasoning ?? ""}
                    onKeyDown={handleReasoningKeyDown}
                    className="min-h-[40vh] w-full resize-y rounded border border-border-color bg-input p-4 text-base leading-relaxed text-main focus:border-accent-orange focus:outline-none md:text-lg"
                  />
                </div>
                <div className="border-t border-border-color px-4 py-2 text-xs text-muted">
                  Ctrl + Enter to save · Esc to cancel
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {isEditing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancel();
          }}
        >
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-lg border border-border-color bg-panel shadow-xl">
            <div className="flex items-center justify-between border-b border-border-color px-4 py-3">
              <div className="text-sm font-semibold text-main">
                Edit message
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={submit}
                  className="rounded p-1.5 text-success-text hover:bg-success-bg"
                  aria-label="Save edit"
                  title="Save edit (Ctrl + Enter)"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={cancel}
                  className="rounded p-1.5 text-danger-text hover:bg-danger-bg"
                  aria-label="Cancel edit"
                  title="Cancel edit"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <textarea
                ref={textareaRef}
                defaultValue={message.content}
                onKeyDown={handleKeyDown}
                className="min-h-[40vh] w-full resize-y rounded border border-border-color bg-input p-4 text-base leading-relaxed text-main focus:border-accent-orange focus:outline-none md:text-lg"
              />
            </div>
            <div className="border-t border-border-color px-4 py-2 text-xs text-muted">
              Ctrl + Enter to save · Esc to cancel
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export const MessageBubble = memo(MessageBubbleInternal);
