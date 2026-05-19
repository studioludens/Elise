import type { ChangeEvent } from "react";
import { parseRules } from "@elise/engine";

export interface RuleEditorProps {
  value: string;
  onChange: (next: string) => void;
}

export function RuleEditor({ value, onChange }: RuleEditorProps): JSX.Element {
  const handle = (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value);
  const ruleCount = parseRules(value).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        htmlFor="rules"
        style={{
          fontSize: 12,
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>Rules</span>
        <span style={{ fontWeight: 400, color: "#666" }} data-testid="rule-count">
          {ruleCount} rule{ruleCount === 1 ? "" : "s"}
        </span>
      </label>
      <textarea
        id="rules"
        value={value}
        onChange={handle}
        rows={6}
        spellCheck={false}
        autoComplete="off"
        style={{ fontFamily: "ui-monospace, monospace", resize: "vertical" }}
      />
    </div>
  );
}
