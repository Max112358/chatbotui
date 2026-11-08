import { AVAILABLE_MODELS } from "@/constants";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  value,
  onChange,
  disabled,
}: ModelSelectorProps) {
  return (
    <div className="relative">
      <input
        type="text"
        list="model-suggestions"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Model ID"
        className="w-40 rounded border border-gray-300 bg-white px-2 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
      />
      <datalist id="model-suggestions">
        {AVAILABLE_MODELS.map((model) => (
          <option key={model} value={model} />
        ))}
      </datalist>
    </div>
  );
}
