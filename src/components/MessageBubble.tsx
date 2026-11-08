import { Message } from "@/types";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex max-w-[85%] gap-3 rounded-lg px-4 py-3 ${
          isUser ? "bg-accent-orange text-dark" : "bg-card text-main shadow"
        }`}
      >
        <div className="mt-1 shrink-0">
          {isUser ? (
            <User size={18} />
          ) : (
            <Bot size={18} className="text-accent-orange" />
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          {message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className={`rounded border p-2 text-xs ${
                    isUser
                      ? "border-accent-orange-hard bg-accent-orange-soft"
                      : "border-border-color bg-input"
                  }`}
                >
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.content}
                      alt={attachment.name}
                      className="max-h-48 rounded"
                    />
                  ) : (
                    <details>
                      <summary className="cursor-pointer">
                        {attachment.name}
                      </summary>
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap">
                        {attachment.content.slice(0, 2000)}
                        {attachment.content.length > 2000 && "…"}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
