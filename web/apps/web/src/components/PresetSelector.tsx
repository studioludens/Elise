import type { ChangeEvent } from "react";
import { PRESETS, type Preset } from "@elise/engine";

export interface PresetSelectorProps {
  value: string;
  onChange: (preset: Preset) => void;
}

export function PresetSelector({ value, onChange }: PresetSelectorProps): JSX.Element {
  const handle = (e: ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    const preset = PRESETS.find((p) => p.name === name);
    if (preset) onChange(preset);
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label htmlFor="preset" style={{ fontSize: 12, fontWeight: 600 }}>
        Preset
      </label>
      <select id="preset" value={value} onChange={handle}>
        {PRESETS.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
