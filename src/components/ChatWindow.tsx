import { useEffect, useRef } from "react";
import { Conversation } from "@/types";
import { Bot } from "lucide-react";
import { MessageBubble } from "./MessageBubble";

interface ChatWindowProps {
  conversation: Conversation | null;
  isStreaming: boolean;
}

export function ChatWindow({ conversation, isStreaming }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages, isStreaming]);

  return (
    <div className="flex-1 min-w-0 overflow-y-auto bg-body p-4">
      {!conversation || conversation.messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-muted">
          <Bot size={48} className="mb-4 text-accent-orange" />
          <p className="text-lg">Start a new conversation</p>
        </div>
      ) : (
        <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6">
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isStreaming && (
            <div className="text-sm text-muted">NanoGPT is typing…</div>
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
