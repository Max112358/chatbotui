import { useEffect, useState } from "react";
import { ApiConfig } from "@/types";
import { DEFAULT_BASE_URL, DEFAULT_MODEL } from "@/constants";

interface SettingsModalProps {
  isOpen: boolean;
  config: ApiConfig;
  onSave: (config: ApiConfig) => void;
}

export function SettingsModal({ isOpen, config, onSave }: SettingsModalProps) {
  const [form, setForm] = useState<ApiConfig>(config);

  useEffect(() => {
    setForm(config);
  }, [config]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      apiKey: form.apiKey.trim(),
      baseUrl: form.baseUrl.trim().replace(/\/$/, "") || DEFAULT_BASE_URL,
      model: form.model.trim() || DEFAULT_MODEL,
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-xl font-semibold">API Settings</h2>
        <p className="mb-4 text-sm text-gray-600">
          Configure any OpenAI-compatible endpoint. Settings are stored only in
          your browser.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              API Key
            </label>
            <input
              type="password"
              value={form.apiKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, apiKey: e.target.value }))
              }
              placeholder="sk-..."
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Base URL
            </label>
            <input
              type="url"
              value={form.baseUrl}
              onChange={(e) =>
                setForm((f) => ({ ...f, baseUrl: e.target.value }))
              }
              placeholder="https://api.nano-gpt.com/api/v1"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Model
            </label>
            <input
              type="text"
              value={form.model}
              onChange={(e) =>
                setForm((f) => ({ ...f, model: e.target.value }))
              }
              placeholder="openai/gpt-6.1-sol"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={!form.apiKey.trim()}
            className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
