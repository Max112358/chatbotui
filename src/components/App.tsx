import { useCallback, useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useConversations } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";
import { useModels } from "@/hooks/useModels";
import { DEFAULT_CONFIG } from "@/constants";
import { SettingsModal } from "./SettingsModal";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { MessageInput } from "./MessageInput";

export default function App() {
  const { config, isLoaded: configLoaded, saveConfig } = useApiConfig();
  const { models: fetchedModels } = useModels(config);

  const {
    conversations,
    isLoaded: conversationsLoaded,
    createConversation,
    updateConversation,
    deleteConversation,
    renameConversation,
    updateMessage,
    deleteMessage,
  } = useConversations();

  const {
    currentConversation,
    selectConversation,
    createNewConversation,
    sendMessage,
    isStreaming,
    stop,
  } = useChat({
    conversations,
    config,
    onCreateConversation: createConversation,
    onUpdateConversation: updateConversation,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [selectedModel, setSelectedModel] = useState(
    config?.model ?? DEFAULT_CONFIG.model,
  );

  const selectedModelInfo = useMemo(
    () => fetchedModels.find((m) => m.id === selectedModel),
    [fetchedModels, selectedModel],
  );

  useEffect(() => {
    if (currentConversation) {
      setSelectedModel(currentConversation.model);
    } else {
      setSelectedModel(config?.model ?? DEFAULT_CONFIG.model);
    }
  }, [currentConversation, config]);

  const handleModelChange = useCallback(
    (model: string) => {
      setSelectedModel(model);
      if (currentConversation) {
        updateConversation(currentConversation.id, (c) => ({
          ...c,
          model,
          updatedAt: Date.now(),
        }));
      }
    },
    [currentConversation, updateConversation],
  );

  const handleEditMessage = useCallback(
    (messageId: string, content: string) => {
      if (!currentConversation) return;

      updateMessage(currentConversation.id, messageId, (message) => ({
        ...message,
        content,
      }));
    },
    [currentConversation, updateMessage],
  );

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (!currentConversation) return;
      deleteMessage(currentConversation.id, messageId);
    },
    [currentConversation, deleteMessage],
  );

  const isReady = configLoaded && conversationsLoaded;

  const handleNewChat = () => {
    createNewConversation(selectedModel);
    setIsSidebarOpen(false);
  };

  if (!isReady) return null;

  return (
    <div className="flex h-[100dvh] w-full max-w-full flex-row overflow-hidden bg-body text-main">
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 rounded bg-card p-2 text-muted shadow md:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <Sidebar
        conversations={conversations}
        currentId={currentConversation?.id ?? null}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onRename={renameConversation}
        onNewChat={handleNewChat}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <ChatWindow
          conversation={currentConversation}
          isStreaming={isStreaming}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
        />

        <MessageInput
          onSend={sendMessage}
          onStop={stop}
          isStreaming={isStreaming}
          model={selectedModel}
          onModelChange={handleModelChange}
          config={config}
          currentConversation={currentConversation}
          selectedModelInfo={selectedModelInfo}
          modelInfos={fetchedModels}
          disabled={!config?.apiKey}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen || !config?.apiKey}
        config={config ?? DEFAULT_CONFIG}
        onSave={(newConfig) => {
          saveConfig(newConfig);
          setIsSettingsOpen(false);
          setSelectedModel(newConfig.model);
        }}
      />
    </div>
  );
}
