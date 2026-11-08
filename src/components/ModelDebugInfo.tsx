import { useModels } from "@/hooks/useModels";
import { ApiConfig } from "@/types";

interface ModelDebugInfoProps {
  config: ApiConfig | null;
}

export function ModelDebugInfo({ config }: ModelDebugInfoProps) {
  const { models, isLoading, error } = useModels(config);

  return (
    <div className="fixed bottom-20 right-4 z-50 max-w-xs rounded border border-border-color bg-panel p-3 text-xs text-main shadow-xl">
      <div className="font-bold text-accent-orange">Model Fetch Debug</div>
      <div>API key set: {config?.apiKey ? "yes" : "no"}</div>
      <div>Base URL: {config?.baseUrl || "none"}</div>
      <div>Loading: {isLoading ? "yes" : "no"}</div>
      <div>Error: {error || "none"}</div>
      <div>Models loaded: {models.length}</div>
      <div className="mt-1 break-all text-muted">
        {models.map((m) => m.id).join(", ")}
      </div>
    </div>
  );
}
