import type { DrawEvent } from '@elise/engine';
import styles from './StatsHud.module.css';

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

function StatsHud({ events, systemLength, rewriteMs, interpretMs }: StatsHudProps): JSX.Element {
    const counts = countByKind(events);
    return (
        <dl data-testid="stats-hud" className={styles.root}>
            <Row k="symbols">{systemLength.toLocaleString()}</Row>
            <Row k="lines">{(counts.get('line') ?? 0).toLocaleString()}</Row>
            <Row k="polys">{(counts.get('poly-end') ?? 0).toLocaleString()}</Row>
            <Row k="arcs">{(counts.get('arc') ?? 0).toLocaleString()}</Row>
            <Row k="rewrite">{fmtMs(rewriteMs)}</Row>
            <Row k="interpret">{fmtMs(interpretMs)}</Row>
        </dl>
    );
}

function Row({ k, children }: { k: string; children: React.ReactNode }): JSX.Element {
    return (
        <div className={styles.row}>
            <dt className={styles.key}>{k}</dt>
            <dd className={styles.value}>{children}</dd>
        </div>
    );
}

export default StatsHud;
