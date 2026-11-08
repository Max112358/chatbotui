import { Conversation } from "@/types";
import { Plus, X } from "lucide-react";
import { ConversationItem } from "./ConversationItem";

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({
  conversations,
  currentId,
  onSelect,
  onDelete,
  onNewChat,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border-color bg-panel transition-transform md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border-color p-4">
            <button
              onClick={onNewChat}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-button-bg py-2 text-sm font-bold text-button-text ring-1 ring-button-border transition-colors hover:bg-button-bg-hover"
            >
              <Plus size={16} />
              New chat
            </button>
            <button
              onClick={onClose}
              className="ml-2 rounded p-2 text-muted hover:bg-card hover:text-main md:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 && (
              <p className="p-2 text-sm text-muted">No conversations yet.</p>
            )}
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === currentId}
                onSelect={() => {
                  onSelect(conversation.id);
                  onClose();
                }}
                onDelete={() => onDelete(conversation.id)}
              />
            ))}
          </div>

          <div className="border-t border-border-color p-4 text-xs text-muted">
            History stored locally only.
          </div>
        </div>
      </aside>
    </>
  );
}
