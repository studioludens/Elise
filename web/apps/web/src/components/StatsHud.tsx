import type { DrawEvent } from "@elise/engine";

export type StatsHudProps = {
  events: readonly DrawEvent[];
  systemLength: number;
  rewriteMs: number;
  interpretMs: number;
};

function countByKind(events: readonly DrawEvent[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of events) m.set(e.kind, (m.get(e.kind) ?? 0) + 1);
  return m;
}

function fmtMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function StatsHud({
  events,
  systemLength,
  rewriteMs,
  interpretMs,
}: StatsHudProps): JSX.Element {
  const counts = countByKind(events);
  return (
    <dl
      data-testid="stats-hud"
      style={{
        position: "absolute",
        right: 8,
        bottom: 8,
        margin: 0,
        padding: "8px 10px",
        background: "rgba(20, 20, 20, 0.78)",
        color: "#e8e8e8",
        fontFamily:
          'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
        fontSize: 11,
        lineHeight: 1.4,
        borderRadius: 4,
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <Row k="symbols">{systemLength.toLocaleString()}</Row>
      <Row k="lines">{(counts.get("line") ?? 0).toLocaleString()}</Row>
      <Row k="polys">{(counts.get("poly-end") ?? 0).toLocaleString()}</Row>
      <Row k="arcs">{(counts.get("arc") ?? 0).toLocaleString()}</Row>
      <Row k="rewrite">{fmtMs(rewriteMs)}</Row>
      <Row k="interpret">{fmtMs(interpretMs)}</Row>
    </dl>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }): JSX.Element {
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
      <dt style={{ opacity: 0.7 }}>{k}</dt>
      <dd style={{ margin: 0 }}>{children}</dd>
    </div>
  );
}
