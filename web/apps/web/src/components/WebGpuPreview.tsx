import { useEffect, useMemo, useRef, useState } from "react";
import type { DrawEvent } from "@elise/engine";
import { eventsToSegments } from "@elise/gpu";
import { computeBounds, fitView, zoomAt, type View } from "../canvas2d.js";
import { useWebGpu } from "../useWebGpu.js";

export interface WebGpuPreviewProps {
  events: readonly DrawEvent[];
  errorMessage?: string | null;
}

const PADDING = 24;
const MIN_ZOOM = 0.01;
const MAX_ZOOM = 1000;

function buildViewProj(view: View, width: number, height: number): Float32Array {
  const m = new Float32Array(16);
  m[0] = (2 * view.scale) / Math.max(width, 1);
  m[5] = (-2 * view.scale) / Math.max(height, 1);
  m[10] = 1;
  m[12] = (2 * view.offsetX) / Math.max(width, 1) - 1;
  m[13] = 1 - (2 * view.offsetY) / Math.max(height, 1);
  m[15] = 1;
  return m;
}

export function WebGpuPreview({ events, errorMessage }: WebGpuPreviewProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);
  const { status, gpu, renderer, error } = useWebGpu(canvasEl);

  const [size, setSize] = useState({ width: 600, height: 600 });
  const viewRef = useRef<View | null>(null);
  const fittedForRef = useRef<readonly DrawEvent[] | null>(null);
  const draggingRef = useRef<{ x: number; y: number } | null>(null);

  const segments = useMemo(() => eventsToSegments(events as DrawEvent[]), [events]);

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

  const draw = (view: View, width: number, height: number) => {
    if (!gpu || !renderer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderer.setCamera({ viewProj: buildViewProj(view, width, height), viewport: [width, height] });
    const encoder = gpu.device.createCommandEncoder({ label: "elise-preview" });
    const view2 = gpu.context.getCurrentTexture().createView();
    renderer.render(encoder, view2, { r: 1, g: 1, b: 1, a: 1 });
    gpu.device.queue.submit([encoder.finish()]);
  };

  useEffect(() => {
    if (status !== "ready" || !gpu || !renderer) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const { width, height } = size;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (!viewRef.current || fittedForRef.current !== events) {
      const bounds = computeBounds(events);
      viewRef.current = fitView(bounds, width, height, PADDING);
      fittedForRef.current = events;
    }
    renderer.setSegments(segments.lines);
    draw(viewRef.current, canvas.width, canvas.height);
  }, [status, gpu, renderer, segments, size, events]);

  const redraw = () => {
    const view = viewRef.current;
    const canvas = canvasRef.current;
    if (!view || !canvas) return;
    draw(view, canvas.width, canvas.height);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const view = viewRef.current;
    if (!view) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = Math.exp(-e.deltaY * 0.0015);
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

  const overlay = (() => {
    if (status === "loading") return "Initializing WebGPU…";
    if (status === "unsupported") {
      return "WebGPU isn't available in this browser. Use Chromium-based browsers or Safari 26+, or switch to the Canvas2D renderer.";
    }
    if (status === "error") return `WebGPU error: ${error ?? "unknown"}`;
    return null;
  })();

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#fafafa",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={(el) => {
          canvasRef.current = el;
          setCanvasEl(el);
        }}
        data-testid="lsystem-webgpu-canvas"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          display: "block",
          touchAction: "none",
          cursor: draggingRef.current ? "grabbing" : "grab",
        }}
      />
      {overlay && (
        <div
          role="status"
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            right: 8,
            padding: "6px 10px",
            background: "rgba(60, 60, 60, 0.92)",
            color: "white",
            fontSize: 12,
            borderRadius: 4,
          }}
        >
          {overlay}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          style={{
            position: "absolute",
            top: overlay ? 44 : 8,
            left: 8,
            right: 8,
            padding: "6px 10px",
            background: "rgba(220, 50, 50, 0.92)",
            color: "white",
            fontSize: 12,
            borderRadius: 4,
          }}
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
}
