import { useState, useRef } from "react";
import { Conversation } from "@/types";
import { MessageSquare, Trash2, Check, X, Pencil } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onRename,
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = () => {
    const value = inputRef.current?.value ?? "";
    if (value.trim()) {
      onRename(value.trim());
    }
    setIsEditing(false);
  };

  const cancel = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      cancel();
    }
  };

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mb-1 flex items-center gap-1 rounded bg-card px-2 py-2 text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          type="text"
          defaultValue={conversation.title}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 rounded border border-border-color bg-input px-2 py-1 text-sm text-main focus:border-accent-orange focus:outline-none"
        />
        <button
          type="submit"
          className="shrink-0 rounded p-1.5 text-success-text hover:bg-success-bg"
          aria-label="Save title"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          onClick={cancel}
          className="shrink-0 rounded p-1.5 text-danger-text hover:bg-danger-bg"
          aria-label="Cancel edit"
        >
          <X size={14} />
        </button>
      </form>
    );
  }

  return (
    <div
      className={`group mb-1 flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm ${
        isActive
          ? "bg-card text-accent-orange"
          : "text-muted hover:bg-card hover:text-main"
      }`}
      onClick={onSelect}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MessageSquare
          size={14}
          className={`shrink-0 ${isActive ? "text-accent-orange" : ""}`}
        />
        <span className="truncate">{conversation.title}</span>
      </div>
      <div className="ml-2 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={startEditing}
          className="rounded p-1.5 text-muted hover:bg-card hover:text-main"
          aria-label="Rename conversation"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded bg-danger-bg p-1.5 text-danger-text ring-1 ring-danger-border transition-colors hover:bg-danger-bg-hover"
          aria-label="Delete conversation"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
