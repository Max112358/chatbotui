import { Message } from "@/types";

export interface ModelInfo {
  id: string;
  object: string;
  context_length?: number;
}

export interface ModelListResponse {
  data: ModelInfo[];
}

export interface ChatChunk {
  content?: string;
  reasoning?: string;
}

interface StreamChoiceDelta {
  content?: string;
  reasoning?: string;
  reasoning_content?: string;
}

interface StreamChoice {
  delta?: StreamChoiceDelta;
}

interface StreamChunk {
  choices?: StreamChoice[];
}

interface NonStreamingMessage {
  content?: string;
  reasoning?: string;
  reasoning_content?: string;
}

interface NonStreamingChoice {
  message?: NonStreamingMessage;
}

interface NonStreamingResponse {
  choices?: NonStreamingChoice[];
}

type ApiContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export async function fetchModels(
  baseUrl: string,
  apiKey: string,
): Promise<ModelInfo[]> {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
  const response = await fetch(`${normalizedBaseUrl}/models?detailed=true`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as ModelListResponse;
  return data.data;
}

function extractReasoning(
  delta: StreamChoiceDelta | NonStreamingMessage | undefined,
): string | undefined {
  if (!delta) return undefined;
  return delta.reasoning ?? delta.reasoning_content;
}

export async function streamChatCompletion(
  baseUrl: string,
  messages: Message[],
  apiKey: string,
  model: string,
  signal: AbortSignal,
  onChunk: (chunk: ChatChunk) => void | Promise<void>,
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
      reasoning: { enabled: true },
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await response.clone().json()) as NonStreamingResponse;
      const message = json.choices?.[0]?.message;
      if (message) {
        const content = message.content ?? "";
        const reasoning = extractReasoning(message);
        if (content || reasoning) {
          await onChunk({ content, reasoning });
          return;
        }
      }
    } catch {
      // Not JSON, continue to streaming path
    }
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data) as StreamChunk;
          const delta = parsed.choices?.[0]?.delta;
          if (!delta) continue;

          const content = delta.content;
          const reasoning = extractReasoning(delta);

          if (
            (typeof content === "string" && content.length > 0) ||
            (typeof reasoning === "string" && reasoning.length > 0)
          ) {
            await onChunk({ content, reasoning });
          }
        } catch {
          // malformed chunk, ignore
        }
      }
    }

    const trimmed = buffer.trim();
    if (trimmed.startsWith("data: ")) {
      const data = trimmed.slice(6);
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data) as StreamChunk;
        const delta = parsed.choices?.[0]?.delta;
        if (delta) {
          const content = delta.content;
          const reasoning = extractReasoning(delta);
          if (
            (typeof content === "string" && content.length > 0) ||
            (typeof reasoning === "string" && reasoning.length > 0)
          ) {
            await onChunk({ content, reasoning });
          }
        }
      } catch {
        // ignore
      }
    }
  } finally {
    reader.cancel().catch(() => {});
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
