import { Message } from "@/types";

interface StreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

type ApiContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export async function streamChatCompletion(
  baseUrl: string,
  messages: Message[],
  apiKey: string,
  model: string,
  signal: AbortSignal,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");

  const response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: formatMessageContent(m),
      })),
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data) as StreamChunk;
        const content = parsed.choices[0]?.delta?.content;
        if (content) onChunk(content);
      } catch {
        // Ignore malformed chunks
      }
    }
  }
}

function formatMessageContent(message: Message): ApiContent {
  const textParts = [
    message.content,
    ...message.attachments
      .filter((a) => a.type === "text")
      .map((a) => `--- ${a.name} ---\n${a.content}`),
  ]
    .filter(Boolean)
    .join("\n\n");

  const imageAttachments = message.attachments.filter(
    (a) => a.type === "image",
  );

  if (imageAttachments.length === 0) {
    return textParts;
  }

  const content: ApiContent = [];
  if (textParts) {
    content.push({ type: "text", text: textParts });
  }

  for (const image of imageAttachments) {
    content.push({
      type: "image_url",
      image_url: { url: image.content },
    });
  }

  return content;
}
