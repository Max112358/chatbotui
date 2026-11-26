import { Conversation } from "@/types";
import { Plus, Settings, X } from "lucide-react";
import { ConversationItem } from "./ConversationItem";
import { useEffect, useState } from "react";
import { getStorageEstimate, StorageEstimate } from "@/services/storageService";

interface SidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  storageMode?: "persistent" | "memory-only";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

export function Sidebar({
  conversations,
  currentId,
  onSelect,
  onDelete,
  onRename,
  onNewChat,
  onOpenSettings,
  isOpen,
  onClose,
  storageMode = "persistent",
}: SidebarProps) {
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const next = await getStorageEstimate();
      if (!cancelled) setEstimate(next);
    }

    refresh();

    const interval = setInterval(refresh, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const barColor =
    estimate && estimate.percentage > 80
      ? "var(--danger-text, #ff4444)"
      : estimate && estimate.percentage > 50
        ? "var(--accent-orange, #ff9900)"
        : "var(--text-muted, #9aa0a6)";

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
        className={`fixed inset-y-0 left-0 z-50 w-[80vw] max-w-[16rem] transform border-r border-border-color bg-panel transition-transform md:static md:w-64 md:max-w-none md:translate-x-0 ${
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
                onRename={(title) => onRename(conversation.id, title)}
              />
            ))}
          </div>

          <div className="border-t border-border-color p-4">
            <button
              onClick={onOpenSettings}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded bg-button-bg py-2 text-sm font-bold text-button-text ring-1 ring-button-border transition-colors hover:bg-button-bg-hover"
            >
              <Settings size={16} />
              Settings
            </button>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-accent-orange">
                  NanoGPT Chat
                </span>
                <span
                  className={`text-[10px] ${
                    storageMode === "memory-only"
                      ? "text-danger-text"
                      : "text-muted"
                  }`}
                >
                  {storageMode === "memory-only" ? "Memory only" : "Persisted"}
                </span>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between text-[10px] text-muted">
                  <span>Storage</span>
                  <span>{estimate ? `${estimate.percentage}%` : "--"}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-input">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${estimate?.percentage ?? 0}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
                {estimate && (
                  <div className="mt-1 text-[10px] text-muted">
                    {formatBytes(estimate.usage)} /{" "}
                    {formatBytes(estimate.quota)}
                  </div>
                )}
              </div>

              <div className="text-xs text-muted">
                {storageMode === "memory-only"
                  ? "Session-only history (storage quota reached)."
                  : "History stored locally only."}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
