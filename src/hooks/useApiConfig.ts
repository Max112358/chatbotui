import { useState, useEffect, useCallback } from "react";
import { ApiConfig } from "@/types";
import { DEFAULT_CONFIG } from "@/constants";
import { getApiConfig, setApiConfig } from "@/services/storageService";

export function useApiConfig() {
  const [config, setConfig] = useState<ApiConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setConfig(getApiConfig() ?? DEFAULT_CONFIG);
    setIsLoaded(true);
  }, []);

  const saveConfig = useCallback((next: ApiConfig) => {
    setApiConfig(next);
    setConfig(next);
  }, []);

  return { config, isLoaded, saveConfig };
}
