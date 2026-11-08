import { useState } from "react";
import { Menu } from "lucide-react";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useConversations } from "@/hooks/useConversations";
import { useChat } from "@/hooks/useChat";
import { DEFAULT_CONFIG } from "@/constants";
import { SettingsModal } from "./SettingsModal";
import { Sidebar } from "./Sidebar";
import { ChatWindow } from "./ChatWindow";
import { MessageInput } from "./MessageInput";

export default function App() {
  const { config, isLoaded: configLoaded, saveConfig } = useApiConfig();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
  const [selectedModel, setSelectedModel] = useState(
    config?.model ?? DEFAULT_CONFIG.model,
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
          onModelChange={setSelectedModel}
          config={config}
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
