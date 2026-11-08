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
import { ModelDebugInfo } from "./ModelDebugInfo";
import { ContextDebugInfo } from "./ContextDebugInfo";
import { ApiDump } from "./ApiDump";

export default function App() {
  const { config, isLoaded: configLoaded, saveConfig } = useApiConfig();
  const { models: fetchedModels } = useModels(config);

  const {
    conversations,
    isLoaded: conversationsLoaded,
    createConversation,
    updateConversation,
    deleteConversation,
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

  // Sync selected model with the current conversation
  useEffect(() => {
    if (currentConversation) {
      setSelectedModel(currentConversation.model);
    } else {
      setSelectedModel(config?.model ?? DEFAULT_CONFIG.model);
    }
  }, [currentConversation, config]);

  // Update the conversation's model when the user changes it
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

  const isReady = configLoaded && conversationsLoaded;

  const handleNewChat = () => {
    createNewConversation(selectedModel);
    setIsSidebarOpen(false);
  };

  if (!isReady) return null;

  return (
    <div className="flex h-screen bg-body text-main">
      <Sidebar
        conversations={conversations}
        currentId={currentConversation?.id ?? null}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col">
        <header className="flex items-center border-b border-border-color bg-card px-4 py-3">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="mr-3 rounded p-1 hover:bg-panel md:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-accent-orange">
            NanoGPT Chat
          </h1>
          <div className="ml-auto">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="rounded bg-button-bg px-3 py-1.5 text-sm text-button-text ring-1 ring-button-border transition-colors hover:bg-button-bg-hover"
            >
              {config?.apiKey ? "Settings" : "Set API key"}
            </button>
          </div>
        </header>

        <ChatWindow
          conversation={currentConversation}
          isStreaming={isStreaming}
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
      <ModelDebugInfo config={config} />
      <ContextDebugInfo selectedModelInfo={selectedModelInfo} config={config} />
      <ApiDump config={config} model={selectedModel} />
    </div>
  );
}
