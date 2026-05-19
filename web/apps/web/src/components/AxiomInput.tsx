import type { ChangeEvent } from "react";

export interface AxiomInputProps {
  value: string;
  onChange: (next: string) => void;
}

export function AxiomInput({ value, onChange }: AxiomInputProps): JSX.Element {
  const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label htmlFor="axiom" style={{ fontSize: 12, fontWeight: 600 }}>
        Axiom
      </label>
      <input
        id="axiom"
        type="text"
        value={value}
        onChange={handle}
        spellCheck={false}
        autoComplete="off"
        style={{ fontFamily: "ui-monospace, monospace" }}
      />
    </div>
  );
}
