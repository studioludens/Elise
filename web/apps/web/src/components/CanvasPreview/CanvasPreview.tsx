import { useEffect, useRef, useState } from 'react';
import type { DrawEvent } from '@elise/engine';
import { computeBounds, fitView, renderEvents, zoomAt, type View } from '../../canvas2d';
import styles from './CanvasPreview.module.css';

export type CanvasPreviewProps = {
    events: readonly DrawEvent[];
    errorMessage?: string | null;
};

const PADDING = 24;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 1000;

function CanvasPreview({ events, errorMessage }: CanvasPreviewProps): JSX.Element {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<View | null>(null);
    const [size, setSize] = useState({ width: 600, height: 600 });
    // Track which event-array identity the current view was fitted against,
    // so we re-fit when the user changes the system but not on every render.
    const fittedForRef = useRef<readonly DrawEvent[] | null>(null);
    const draggingRef = useRef<{ x: number; y: number } | null>(null);

    // Observe container size.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const cr = entry.contentRect;
                setSize({ width: Math.max(1, cr.width), height: Math.max(1, cr.height) });
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Draw whenever events, size, or view changes.
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const { width, height } = size;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // (Re)fit if events changed or no view yet.
        if (!viewRef.current || fittedForRef.current !== events) {
            const bounds = computeBounds(events);
            viewRef.current = fitView(bounds, width, height, PADDING);
            fittedForRef.current = events;
        }
        renderEvents(ctx, events, viewRef.current, width, height, dpr);
    }, [events, size]);

    const redraw = () => {
        const canvas = canvasRef.current;
        if (!canvas || !viewRef.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        renderEvents(ctx, events, viewRef.current, size.width, size.height, dpr);
    };

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const view = viewRef.current;
        if (!view) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        // Both trackpad pinch (ctrl/meta) and plain wheel zoom.
        const delta = e.deltaY;
        const factor = Math.exp(-delta * 0.0015);
        const next = zoomAt(view, factor, sx, sy);
        next.scale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next.scale));
        viewRef.current = next;
        redraw();
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        draggingRef.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
        const drag = draggingRef.current;
        const view = viewRef.current;
        if (!drag || !view) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        draggingRef.current = { x: e.clientX, y: e.clientY };
        viewRef.current = {
            ...view,
            offsetX: view.offsetX + dx,
            offsetY: view.offsetY + dy,
        };
        redraw();
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
        }
        draggingRef.current = null;
    };

    return (
        <div ref={containerRef} className={styles.root}>
            <canvas
                ref={canvasRef}
                data-testid="lsystem-canvas"
                className={styles.canvas}
                onWheel={handleWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ cursor: draggingRef.current ? 'grabbing' : 'grab' }}
            />
            {errorMessage && (
                <div role="alert" className={styles.error}>
                    {errorMessage}
                </div>
            )}
        </div>
    );
}

export default CanvasPreview;
