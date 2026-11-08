import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { ApiConfig } from "@/types";
import { useModels } from "@/hooks/useModels";
import { AVAILABLE_MODELS } from "@/constants";
import { ChevronDown, RefreshCw } from "lucide-react";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  config: ApiConfig | null;
  disabled?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  config,
  disabled,
}: ModelSelectorProps) {
  const { models: fetchedModels, isLoading, refetch } = useModels(config);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const allModels = useMemo(() => {
    const combined = [...AVAILABLE_MODELS, ...fetchedModels];
    const unique = Array.from(new Set(combined));
    return unique.sort();
  }, [fetchedModels]);

  const filteredModels = useMemo(() => {
    if (!search.trim()) return allModels;
    const lower = search.toLowerCase();
    return allModels.filter((m) => m.toLowerCase().includes(lower));
  }, [allModels, search]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [search]);

  const handleSelect = useCallback(
    (model: string) => {
      onChange(model);
      setSearch("");
      setIsOpen(false);
      inputRef.current?.blur();
    },
    [onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) =>
          Math.min(prev + 1, filteredModels.length - 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredModels[highlightedIndex]) {
          handleSelect(filteredModels[highlightedIndex]);
        }
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    [filteredModels, highlightedIndex, handleSelect],
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center gap-1">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? search : value}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              setSearch("");
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Search models..."
            className="w-64 rounded border border-border-color bg-input py-2 pl-3 pr-8 text-sm text-main placeholder-muted ring-1 ring-transparent focus:border-accent-orange focus:outline-none focus:ring-accent-orange-hard disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            disabled={disabled}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-accent-orange disabled:opacity-50"
          >
            <ChevronDown size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || disabled || !config?.apiKey}
          title="Refresh models"
          className="rounded bg-button-bg p-2 text-button-text ring-1 ring-button-border transition-colors hover:bg-button-bg-hover disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-50 mb-1 max-h-60 w-64 overflow-auto rounded border border-border-color bg-panel py-1 shadow-xl">
          {isLoading && filteredModels.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted">Loading...</div>
          )}

          {!isLoading && filteredModels.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted">No models found</div>
          )}

          {filteredModels.map((model, index) => (
            <button
              key={model}
              type="button"
              onClick={() => handleSelect(model)}
              className={`w-full px-3 py-2 text-left text-sm text-main hover:bg-card hover:text-accent-orange ${
                index === highlightedIndex ? "bg-card text-accent-orange" : ""
              } ${model === value ? "font-medium text-accent-orange" : ""}`}
            >
              {model}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
