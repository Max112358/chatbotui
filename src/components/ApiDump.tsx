import { useEffect, useState } from "react";
import { ApiConfig } from "@/types";

interface ApiDumpProps {
  config: ApiConfig | null;
  model?: string;
}

export function ApiDump({ config, model }: ApiDumpProps) {
  const [modelsDump, setModelsDump] = useState<string>("loading...");
  const [modelDump, setModelDump] = useState<string>("loading...");

  useEffect(() => {
    if (!config?.apiKey || !config?.baseUrl) {
      setModelsDump("No config");
      setModelDump("No config");
      return;
    }

    const normalizedBaseUrl = config.baseUrl.replace(/\/$/, "");

    fetch(`${normalizedBaseUrl}/models`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        setModelsDump(JSON.stringify(data, null, 2));
      })
      .catch((e) => {
        setModelsDump(`Error: ${e.message}`);
      });

    if (model) {
      fetch(`${normalizedBaseUrl}/models/${encodeURIComponent(model)}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      })
        .then((r) => {
          if (r.status === 404) return "404 - no model-specific endpoint";
          return r.text();
        })
        .then((data) => {
          setModelDump(
            typeof data === "string" ? data : JSON.stringify(data, null, 2),
          );
        })
        .catch((e) => {
          setModelDump(`Error: ${e.message}`);
        });
    }
  }, [config, model]);

  return (
    <div className="fixed left-2 right-2 bottom-2 z-50 max-h-96 overflow-auto rounded border border-border-color bg-panel p-3 text-xs text-main shadow-xl sm:left-4 sm:right-auto sm:bottom-4 sm:max-w-xl">
      <div className="mb-2 font-bold text-accent-orange">Full /models dump</div>
      <pre className="mb-4 whitespace-pre-wrap font-mono text-muted">
        {modelsDump}
      </pre>
      <div className="mb-2 font-bold text-accent-orange">
        Model-specific dump
      </div>
      <pre className="whitespace-pre-wrap font-mono text-muted">
        {modelDump}
      </pre>
    </div>
  );
}
