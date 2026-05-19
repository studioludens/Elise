import type { ChangeEvent } from "react";
import { hexToRgb, rgbToHsv, type HSV } from "@elise/engine";

export interface ColorPickerProps {
  /** Current color expressed as `#rrggbb`. */
  value: string;
  onChange: (hex: string, hsv: HSV) => void;
}

function hexStringToInt(s: string): number {
  return parseInt(s.replace(/^#/, ""), 16) || 0;
}

export function ColorPicker({ value, onChange }: ColorPickerProps): JSX.Element {
  const handle = (e: ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    const rgb = hexToRgb(hexStringToInt(hex));
    onChange(hex, rgbToHsv(rgb));
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label htmlFor="line-color" style={{ fontSize: 12, fontWeight: 600 }}>
        Line color
      </label>
      <input
        id="line-color"
        type="color"
        value={value}
        onChange={handle}
        style={{ width: 56, height: 28, padding: 0, border: "1px solid #ccc" }}
      />
    </div>
  );
}
