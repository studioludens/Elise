export type ToolbarProps = {
  onExportSvg: () => void;
  onSaveLsys: () => void;
  onOpenLsys: () => void;
  onResetPreset: () => void;
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
  onSaveLsys,
  onOpenLsys,
  onResetPreset,
}: ToolbarProps): JSX.Element {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <button type="button" style={buttonStyle} onClick={onExportSvg}>
        Export SVG
      </button>
      <button type="button" style={buttonStyle} onClick={onSaveLsys}>
        Save .lsys
      </button>
      <button type="button" style={buttonStyle} onClick={onOpenLsys}>
        Open .lsys
      </button>
      <button type="button" style={buttonStyle} onClick={onResetPreset}>
        Reset to preset
      </button>
    </div>
  );
}
