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
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-900 text-slate-100 transition-transform md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-700 p-4">
            <button
              onClick={onNewChat}
              className="flex flex-1 items-center justify-center gap-2 rounded border border-slate-600 py-2 text-sm hover:bg-slate-800"
            >
              <Plus size={16} />
              New chat
            </button>
            <button
              onClick={onClose}
              className="ml-2 rounded p-2 hover:bg-slate-800 md:hidden"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {conversations.length === 0 && (
              <p className="p-2 text-sm text-slate-400">
                No conversations yet.
              </p>
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

          <div className="border-t border-slate-700 p-4 text-xs text-slate-500">
            History stored locally only.
          </div>
        </div>
      </aside>
    </>
  );
}
