import type { ChangeEvent } from "react";

export type SliderFieldProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: SliderFieldProps): JSX.Element {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number(e.target.value);
    if (Number.isFinite(n)) onChange(n);
  };
  const id = `slider-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600 }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          style={{ flex: 1 }}
        />
        <input
          type="number"
          aria-label={`${label} value`}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          style={{ width: 72 }}
        />
      </div>
    </div>
  );
}
