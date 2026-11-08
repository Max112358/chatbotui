import { ApiConfig, ModelInfo } from "@/types";

interface ContextDebugInfoProps {
  selectedModelInfo?: ModelInfo;
  config: ApiConfig | null;
}

export function ContextDebugInfo({
  selectedModelInfo,
  config,
}: ContextDebugInfoProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded border border-border-color bg-panel p-3 text-xs text-main shadow-xl">
      <div className="font-bold text-accent-orange">Context Debug</div>
      <div>API key set: {config?.apiKey ? "yes" : "no"}</div>
      <div>Base URL: {config?.baseUrl || "none"}</div>
      <div>Selected model: {selectedModelInfo?.id || "none"}</div>
      <div>
        context_length: {selectedModelInfo?.context_length ?? "undefined"}
      </div>
      <div className="mt-1 break-all text-muted">
        Raw: {JSON.stringify(selectedModelInfo)}
      </div>
    </div>
  );
}
