import { Message } from "@/types";
import { User, Bot } from "lucide-react";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[85%] min-w-0 gap-3 rounded-lg bg-card px-4 py-3 text-main shadow">
        <div className="mt-1 shrink-0">
          {isUser ? (
            <User size={18} />
          ) : (
            <Bot size={18} className="text-accent-orange" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2 break-words">
          <div className="text-sm">
            <MarkdownRenderer content={message.content} />
          </div>
          {message.attachments.length > 0 && (
            <div className="space-y-2">
              {message.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="rounded border border-border-color bg-input p-2 text-xs"
                >
                  {attachment.type === "image" ? (
                    <img
                      src={attachment.content}
                      alt={attachment.name}
                      className="max-h-48 w-full max-w-full rounded object-contain"
                    />
                  ) : (
                    <details>
                      <summary className="cursor-pointer">
                        {attachment.name}
                      </summary>
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words">
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
