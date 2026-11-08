import { useState, useEffect, useCallback } from "react";
import { ApiConfig } from "@/types";
import { fetchModels } from "@/services/apiService";

const STORAGE_KEY = "nanogpt_models_cache";

interface CachedModels {
  models: string[];
  fetchedAt: number;
  baseUrl: string;
}

export function useModels(config: ApiConfig | null) {
  const [models, setModels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(
    async (force = false) => {
      if (!config?.apiKey || !config?.baseUrl) {
        setModels([]);
        return;
      }

      if (!force) {
        const cached = localStorage.getItem(STORAGE_KEY);
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as CachedModels;
            if (
              parsed.baseUrl === config.baseUrl &&
              Date.now() - parsed.fetchedAt < 24 * 60 * 60 * 1000
            ) {
              setModels(parsed.models);
              return;
            }
          } catch {
            // ignore corrupt cache
          }
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetched = await fetchModels(config.baseUrl, config.apiKey);
        setModels(fetched);

        try {
          const cache: CachedModels = {
            models: fetched,
            fetchedAt: Date.now(),
            baseUrl: config.baseUrl,
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
        } catch {
          // ignore storage errors
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch models");
      } finally {
        setIsLoading(false);
      }
    },
    [config?.apiKey, config?.baseUrl],
  );

  useEffect(() => {
    void loadModels();
  }, [loadModels]);

  return { models, isLoading, error, refetch: () => loadModels(true) };
}
