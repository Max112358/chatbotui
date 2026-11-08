import { Conversation } from "@/types";
import { MessageSquare, Trash2 } from "lucide-react";

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: ConversationItemProps) {
  return (
    <div
      className={`group mb-1 flex cursor-pointer items-center justify-between rounded px-3 py-2 text-sm ${
        isActive
          ? "bg-card text-accent-orange"
          : "text-muted hover:bg-card hover:text-main"
      }`}
      onClick={onSelect}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MessageSquare
          size={14}
          className={`shrink-0 ${isActive ? "text-accent-orange" : ""}`}
        />
        <span className="truncate">{conversation.title}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="ml-2 shrink-0 rounded bg-danger-bg p-1.5 text-danger-text opacity-0 ring-1 ring-danger-border transition-opacity hover:bg-danger-bg-hover group-hover:opacity-100"
        aria-label="Delete conversation"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
