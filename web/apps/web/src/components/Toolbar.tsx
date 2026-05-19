import { useRef } from "react";

export type ToolbarProps = {
  onExportSvg: () => void;
  onResetPreset: () => void;
  onSaveLsys: () => void;
  onOpenLsys: (text: string, filename: string) => void;
};

const buttonStyle = {
  padding: "6px 12px",
  fontSize: 13,
  border: "1px solid #888",
  borderRadius: 4,
  background: "#f5f5f5",
  cursor: "pointer",
};

export function Toolbar({
  onExportSvg,
  onResetPreset,
  onSaveLsys,
  onOpenLsys,
}: ToolbarProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onOpenLsys(text, file.name);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button type="button" style={buttonStyle} onClick={onExportSvg}>
        Export SVG
      </button>
      <button type="button" style={buttonStyle} onClick={onSaveLsys}>
        Save .lsys
      </button>
      <button
        type="button"
        style={buttonStyle}
        onClick={() => fileInputRef.current?.click()}
      >
        Open .lsys
      </button>
      <button type="button" style={buttonStyle} onClick={onResetPreset}>
        Reset to preset
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".lsys,.xml,application/xml,text/xml"
        style={{ display: "none" }}
        onChange={onFileChange}
        data-testid="lsys-file-input"
      />
    </div>
  );
}
