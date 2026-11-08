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
        isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-800"
      }`}
      onClick={onSelect}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MessageSquare size={14} className="shrink-0" />
        <span className="truncate">{conversation.title}</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="ml-2 shrink-0 rounded p-1 opacity-0 hover:bg-gray-700 group-hover:opacity-100"
        aria-label="Delete conversation"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
