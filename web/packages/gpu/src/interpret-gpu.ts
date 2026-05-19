/**
 * GPU interpreter — Option B (pragmatic).
 *
 * The CPU does a single serial walk over the token stream to compute, for each
 * draw-emitting token, the *starting* turtle state (x, y, angle, lineLength,
 * thickness, color, optional length multiplier). It packs these into a
 * `DrawRecord` buffer (32 bytes each).
 *
 * The GPU compute kernel `interpret.wgsl` then:
 *   - reads one DrawRecord per thread
 *   - computes the endpoint
 *   - writes a `Segment` (24 bytes) at the same index, in the format
 *     `LineRenderer.setSegments` expects.
 *
 * The returned `GPUBuffer` has both `STORAGE` and `COPY_SRC` usage and can be
 * fed straight into `LineRenderer.setSegmentBuffer()`.
 *
 * For non-drawing tokens (rotation, color mutation, brackets, etc.) the state
 * update happens entirely on the CPU and never produces a record. This is the
 * pragmatic compromise: we keep the serial bracket walk on the CPU but
 * parallelise the endpoint math, color packing, and segment-buffer assembly.
 *
 * Future work (Option A): see the TODO at the top of `shaders/interpret.wgsl.ts`.
 */

import { hsvToHex, Turtle, type DrawEvent, type InterpretOptions } from "@elise/engine";
import type { ElisGpu } from "./device.js";
import { decodeTokens, isNoArg, type DecodedToken } from "./tokens-gpu.js";
import { INTERPRET_WGSL } from "./shaders/interpret.wgsl.js";
import { SEGMENT_BYTES } from "./renderer.js";

const DRAW_RECORD_BYTES = 32;
const INTERPRET_WORKGROUP = 256;

interface InterpretGpuOptions extends InterpretOptions {
  /** Hard cap on the number of draw records emitted. */
  maxDrawRecords?: number;
}

/** Pack 0xRRGGBB -> 0xRRGGBBAA u32 (A = 0xFF). */
function colorRgba(hex: number): number {
  return (((hex >>> 0) << 8) | 0xff) >>> 0;
}

/** Walk a packed token stream + emit DrawRecords. */
function tokensToDrawRecords(
  tokens: DecodedToken[],
  options: InterpretGpuOptions,
): { records: Uint8Array<ArrayBuffer>; count: number; cpuEvents: DrawEvent[] } {
  const angle = options.angle ?? 90;
  const ratio = options.ratio ?? 0.99;
  const t = new Turtle(options);
  const events: DrawEvent[] = [];
  const records: number[] = [];

  const pushRecord = (
    kind: number,
    x0: number,
    y0: number,
    turtleAngle: number,
    lineLength: number,
    color: number,
    thickness: number,
    arg: number,
  ) => {
    // Stored as raw 32-bit words; layout matches WGSL DrawRecord.
    records.push(
      kind >>> 0,
      f32ToU32(x0),
      f32ToU32(y0),
      f32ToU32(turtleAngle),
      f32ToU32(lineLength),
      colorRgba(color) >>> 0,
      f32ToU32(thickness),
      f32ToU32(arg),
    );
  };

  events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });

  for (const tok of tokens) {
    const ch = tok.char;
    const arg0 = tok.arg0;
    const arg1 = tok.arg1;
    const arg2 = tok.arg2;
    const hasArg0 = !isNoArg(arg0);
    const hasArg1 = !isNoArg(arg1);
    const hasArg2 = !isNoArg(arg2);

    switch (ch) {
      case "F":
      case "G": {
        const x0 = t.x;
        const y0 = t.y;
        const a = hasArg0 ? arg0 : 1;
        pushRecord(0, x0, y0, t.angle, t.lineLength, hsvToHex(t.hsv), t.lineThickness, a);
        t.moveForward(hasArg0 ? t.lineLength * arg0 : t.lineLength);
        events.push({
          kind: "line",
          x0,
          y0,
          x1: t.x,
          y1: t.y,
          color: hsvToHex(t.hsv),
          thickness: t.lineThickness,
        });
        break;
      }
      case "B": {
        const x0 = t.x;
        const y0 = t.y;
        const a = hasArg0 ? arg0 : 1;
        pushRecord(1, x0, y0, t.angle, t.lineLength, hsvToHex(t.hsv), t.lineThickness, a);
        t.moveBackward(hasArg0 ? t.lineLength * arg0 : t.lineLength);
        events.push({
          kind: "line",
          x0,
          y0,
          x1: t.x,
          y1: t.y,
          color: hsvToHex(t.hsv),
          thickness: t.lineThickness,
        });
        break;
      }
      case "f":
      case "g": {
        t.moveForward(hasArg0 ? t.lineLength * arg0 : t.lineLength);
        events.push({ kind: "move", x: t.x, y: t.y });
        break;
      }
      case "+":
        t.rotateLeft(hasArg0 ? arg0 : angle);
        break;
      case "-":
        t.rotateRight(hasArg0 ? arg0 : angle);
        break;
      case "$":
        t.resetRotation();
        break;
      case "!":
        t.lineLength *= hasArg0 ? arg0 : ratio;
        break;
      case "@":
        t.lineLength /= hasArg0 ? arg0 : ratio;
        break;
      case "[":
        t.pushState();
        break;
      case "]":
        t.popState();
        events.push({ kind: "move", x: t.x, y: t.y });
        break;
      case "V":
        if (hasArg0) t.hsv.v = arg0;
        else t.brightnessUp();
        events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });
        break;
      case "v":
        t.brightnessDown();
        events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });
        break;
      case "C":
        if (hasArg0 && hasArg1 && hasArg2) {
          t.hsv.h = arg0;
          t.hsv.s = arg1;
          t.hsv.v = arg2;
        } else if (hasArg0) {
          t.hsv.h = arg0;
        } else {
          t.hueUp();
        }
        events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });
        break;
      case "c":
        t.hueDown();
        events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });
        break;
      case "S":
        if (hasArg0) t.hsv.s = arg0;
        else t.saturationUp();
        events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });
        break;
      case "s":
        t.saturationDown();
        events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });
        break;
      case "{":
        events.push({ kind: "poly-start", x: t.x, y: t.y, color: hsvToHex(t.hsv) });
        break;
      case "}":
        events.push({ kind: "poly-end" });
        break;
      case ".":
        events.push({ kind: "poly-point", x: t.x, y: t.y });
        break;
      case "\\":
        t.lineThickness = t.lineThickness < 0.01 ? 0 : t.lineThickness / 1.2;
        events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });
        break;
      case "/":
        t.lineThickness = t.lineThickness < 0.01 ? 0.01 : t.lineThickness * 1.2;
        events.push({ kind: "style", color: hsvToHex(t.hsv), thickness: t.lineThickness });
        break;
      default:
        break;
    }
  }

  // records is a flat sequence of u32 words; convert via a typed-array view.
  // Allocate the underlying ArrayBuffer explicitly so the resulting
  // Uint8Array carries `Uint8Array<ArrayBuffer>` (the WebGPU type defs
  // refuse `Uint8Array<ArrayBufferLike>`).
  const count = records.length / (DRAW_RECORD_BYTES / 4);
  const max = options.maxDrawRecords ?? 5_000_000;
  if (count > max) {
    throw new Error(`interpretOnGpu: too many draw records (${count} > ${max})`);
  }
  const buf = new ArrayBuffer(records.length * 4);
  new Uint32Array(buf).set(records);
  return { records: new Uint8Array(buf), count, cpuEvents: events };
}

/** Reusable f32→u32 bit cast scratch (module-local; not thread-safe). */
const _scratch = new ArrayBuffer(4);
const _scratchF32 = new Float32Array(_scratch);
const _scratchU32 = new Uint32Array(_scratch);
function f32ToU32(v: number): number {
  _scratchF32[0] = v;
  return _scratchU32[0]!;
}

export interface InterpretGpuResult {
  /** Storage buffer of `Segment` records, ready for `LineRenderer.setSegmentBuffer`. */
  segmentBuffer: GPUBuffer;
  /** Number of segments. */
  segmentCount: number;
  /**
   * The CPU-side `DrawEvent[]` is also returned, since the bracket walker had
   * to compute it anyway. Useful for SVG export, polygon fills (`poly-*`), and
   * tests that compare against the CPU reference.
   */
  cpuEvents: DrawEvent[];
}

/**
 * Interpret a token stream on the GPU (Option B).
 *
 * `system` is a packed Token buffer as produced by `encodeTokens` or
 * `rewriteOnGpu`. Pass the engine's CPU rewrite output through `encodeTokens`
 * if you're calling this directly.
 */
export async function interpretOnGpu(
  elis: ElisGpu,
  system: Uint8Array,
  options: InterpretGpuOptions = {},
): Promise<InterpretGpuResult> {
  const { device } = elis;
  const tokens = decodeTokens(system);
  const { records, count, cpuEvents } = tokensToDrawRecords(tokens, options);

  if (count === 0) {
    // Empty draw set: still return a tiny placeholder buffer so callers
    // never have to deal with `null`.
    const empty = device.createBuffer({
      label: "elise-interp.segments-empty",
      size: 256,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });
    return { segmentBuffer: empty, segmentCount: 0, cpuEvents };
  }

  const recordsBuf = device.createBuffer({
    label: "elise-interp.records",
    size: Math.max(256, count * DRAW_RECORD_BYTES),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(recordsBuf, 0, records);

  const segmentBuf = device.createBuffer({
    label: "elise-interp.segments",
    size: Math.max(256, count * SEGMENT_BYTES),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
  });

  const paramsBuf = device.createBuffer({
    label: "elise-interp.params",
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });
  {
    const p = new Uint32Array([count >>> 0, 0, 0, 0]);
    device.queue.writeBuffer(paramsBuf, 0, p.buffer);
  }

  const layout = device.createBindGroupLayout({
    label: "elise-interp.bgl",
    entries: [
      { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: "uniform" } },
      { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: "read-only-storage" } },
      { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: "storage" } },
    ],
  });
  const pipeline = device.createComputePipeline({
    label: "elise-interp.pipeline",
    layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
    compute: {
      module: device.createShaderModule({ code: INTERPRET_WGSL }),
      entryPoint: "main",
    },
  });

  const bg = device.createBindGroup({
    label: "elise-interp.bg",
    layout,
    entries: [
      { binding: 0, resource: { buffer: paramsBuf } },
      { binding: 1, resource: { buffer: recordsBuf } },
      { binding: 2, resource: { buffer: segmentBuf } },
    ],
  });

  const encoder = device.createCommandEncoder({ label: "elise-interp.encode" });
  {
    const pass = encoder.beginComputePass();
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bg);
    pass.dispatchWorkgroups(Math.ceil(count / INTERPRET_WORKGROUP));
    pass.end();
  }
  device.queue.submit([encoder.finish()]);

  // Hand the segment buffer back to the caller. They take ownership.
  // We must NOT destroy `segmentBuf` here; we DO destroy the intermediate
  // ones once the queue has them.
  recordsBuf.destroy();
  paramsBuf.destroy();

  return { segmentBuffer: segmentBuf, segmentCount: count, cpuEvents };
}

/**
 * Convenience: re-derive the `LineRenderer`-ready storage buffer from a
 * packed token stream by chaining `interpretOnGpu` + `LineRenderer.setSegmentBuffer`.
 * Kept inline here as a doc note rather than exported, since the caller is
 * usually a React component that owns the LineRenderer instance.
 */
