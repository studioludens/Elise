/**
 * Convert engine `DrawEvent[]`s into the packed GPU buffers consumed by
 * `LineRenderer` (and an analogous polygon pass).
 *
 * Layout, per line segment (24 bytes / 6 floats):
 *   [ x0, y0, x1, y1, colorRGBA(f32 bitcast of u32), thickness ]
 *
 * Color packing: `0xRRGGBB` (from the engine) is widened to RGBA `0xRRGGBBAA`
 * with A = 0xFF, then bit-cast to a float so it can ride along in a Float32Array
 * without precision loss. The shader bit-casts it back.
 *
 * Polygons: we choose the simpler approach for v1 — emit one segment per
 * polygon edge (an outline) into the same `lines` buffer, plus a fan-triangle
 * vertex buffer for fills.  Documented assumption: polygons in the engine are
 * always convex-enough that fan tessellation around the first vertex looks OK.
 *
 * Arcs: tessellated into N straight segments where N scales with radius
 * (clamped to [8, 16]).
 */

import type { DrawEvent } from "@elise/engine";

/** Number of f32s per segment. */
export const SEGMENT_FLOATS = 6;
/** Bytes per segment. */
export const SEGMENT_STRIDE = SEGMENT_FLOATS * 4;

/** Number of f32s per polygon vertex (x, y, color-bitcast-f32). */
export const POLY_VERTEX_FLOATS = 3;
export const POLY_VERTEX_STRIDE = POLY_VERTEX_FLOATS * 4;

const scratch = new ArrayBuffer(4);
const scratchF32 = new Float32Array(scratch);
const scratchU32 = new Uint32Array(scratch);

function u32BitsToF32(bits: number): number {
  scratchU32[0] = bits >>> 0;
  return scratchF32[0]!;
}

/** Pack 0xRRGGBB -> f32 bit pattern of 0xRRGGBBAA (A=0xFF). */
export function packColorRgba(hex: number): number {
  const rgba = (((hex >>> 0) << 8) | 0xff) >>> 0;
  return u32BitsToF32(rgba);
}

export interface SegmentBuffers {
  /** Packed line segments: 6 floats each. */
  lines: Float32Array;
  /** Packed polygon-fill triangles: 3 floats per vertex, 3 vertices per triangle. */
  polygons: Float32Array;
}

interface ArcOptions {
  minSubdivisions: number;
  maxSubdivisions: number;
  /** Approximate pixels per subdivision; arc radius determines the rest. */
  pixelsPerSubdivision: number;
}

const DEFAULT_ARC: ArcOptions = {
  minSubdivisions: 8,
  maxSubdivisions: 16,
  pixelsPerSubdivision: 20,
};

function tessellateArc(
  e: Extract<DrawEvent, { kind: "arc" }>,
  opts: ArcOptions = DEFAULT_ARC,
): Array<{ x0: number; y0: number; x1: number; y1: number }> {
  // Compute the centre of the arc from endpoints + radius + large/sweep flags.
  // This mirrors the standard SVG arc resolution.
  const { x0, y0, x1, y1, radius, large, sweep } = e;
  const r = Math.max(Math.abs(radius), 1e-6);
  const dx = (x1 - x0) / 2;
  const dy = (y1 - y0) / 2;
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const d2 = dx * dx + dy * dy;
  const inside = Math.max(r * r - d2, 0);
  const f = Math.sqrt(inside / Math.max(d2, 1e-12));
  const sign = large === sweep ? 1 : -1;
  const cx = mx + sign * f * dy;
  const cy = my - sign * f * dx;
  const a0 = Math.atan2(y0 - cy, x0 - cx);
  const a1 = Math.atan2(y1 - cy, x1 - cx);
  let delta = a1 - a0;
  if (sweep) {
    if (delta < 0) delta += Math.PI * 2;
  } else {
    if (delta > 0) delta -= Math.PI * 2;
  }
  if (large) {
    if (Math.abs(delta) < Math.PI) {
      delta = delta >= 0 ? delta - Math.PI * 2 : delta + Math.PI * 2;
    }
  }
  const subdivs = Math.max(
    opts.minSubdivisions,
    Math.min(
      opts.maxSubdivisions,
      Math.ceil((Math.abs(delta) * r) / opts.pixelsPerSubdivision),
    ),
  );
  const segs: Array<{ x0: number; y0: number; x1: number; y1: number }> = [];
  let px = x0;
  let py = y0;
  for (let k = 1; k <= subdivs; k++) {
    const t = k / subdivs;
    const a = a0 + delta * t;
    const nx = cx + r * Math.cos(a);
    const ny = cy + r * Math.sin(a);
    segs.push({ x0: px, y0: py, x1: nx, y1: ny });
    px = nx;
    py = ny;
  }
  return segs;
}

interface PolyState {
  active: boolean;
  color: number;
  // Vertices accumulated since poly-start.
  xs: number[];
  ys: number[];
}

export function eventsToSegments(events: DrawEvent[]): SegmentBuffers {
  // Two-pass: collect into arrays then pack. Simplicity > raw speed; this
  // runs on the CPU anyway and is not on the hot path of large redraws once
  // the GPU pipeline takes over.
  const lineFloats: number[] = [];
  const polyFloats: number[] = [];

  let currentColor = 0xffffff;
  let currentThickness = 1;
  const poly: PolyState = { active: false, color: 0xffffff, xs: [], ys: [] };

  const pushLine = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: number,
    thickness: number,
  ) => {
    lineFloats.push(x0, y0, x1, y1, packColorRgba(color), thickness);
  };

  const flushPoly = () => {
    if (!poly.active || poly.xs.length < 3) {
      poly.active = false;
      poly.xs.length = 0;
      poly.ys.length = 0;
      return;
    }
    const colorBits = packColorRgba(poly.color);
    const ax = poly.xs[0]!;
    const ay = poly.ys[0]!;
    // Fan from vertex 0; (0, i, i+1) for i in [1, n-2].
    for (let i = 1; i < poly.xs.length - 1; i++) {
      const bx = poly.xs[i]!;
      const by = poly.ys[i]!;
      const cx = poly.xs[i + 1]!;
      const cy = poly.ys[i + 1]!;
      polyFloats.push(ax, ay, colorBits, bx, by, colorBits, cx, cy, colorBits);
    }
    // Also emit one segment per polygon edge into the line buffer so the
    // outline matches the original engine output. Use the polygon's color
    // and the *currently active* thickness.
    for (let i = 0; i < poly.xs.length; i++) {
      const j = (i + 1) % poly.xs.length;
      pushLine(
        poly.xs[i]!,
        poly.ys[i]!,
        poly.xs[j]!,
        poly.ys[j]!,
        poly.color,
        currentThickness,
      );
    }
    poly.active = false;
    poly.xs.length = 0;
    poly.ys.length = 0;
  };

  for (const ev of events) {
    switch (ev.kind) {
      case "style":
        currentColor = ev.color;
        currentThickness = ev.thickness;
        break;
      case "line":
        pushLine(ev.x0, ev.y0, ev.x1, ev.y1, ev.color, ev.thickness);
        break;
      case "move":
        // No geometry — turtle just teleported.
        break;
      case "poly-start":
        // If a previous polygon was left open (malformed input), flush it first.
        flushPoly();
        poly.active = true;
        poly.color = ev.color;
        poly.xs.push(ev.x);
        poly.ys.push(ev.y);
        break;
      case "poly-point":
        if (poly.active) {
          poly.xs.push(ev.x);
          poly.ys.push(ev.y);
        }
        break;
      case "poly-end":
        flushPoly();
        break;
      case "arc": {
        const segs = tessellateArc(ev);
        for (const s of segs) {
          pushLine(s.x0, s.y0, s.x1, s.y1, ev.color, ev.thickness);
        }
        break;
      }
      default: {
        // Exhaustiveness check: assigning to `never` will fail to compile if
        // a new DrawEvent kind is added without handling here.
        const _exhaustive: never = ev;
        void _exhaustive;
      }
    }
    // Suppress unused-color warning when only style events flow through.
    void currentColor;
  }
  // If the stream ended without a poly-end, flush whatever we have.
  flushPoly();

  return {
    lines: Float32Array.from(lineFloats),
    polygons: Float32Array.from(polyFloats),
  };
}
