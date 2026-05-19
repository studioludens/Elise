/**
 * Thick-line renderer using instanced quads.
 *
 * Usage:
 *   const r = new LineRenderer(elis);
 *   r.setSegments(floats);             // Float32Array, 6 floats per segment
 *   r.setCamera({ viewProj, viewport });
 *   r.render(commandEncoder, view);    // view = current swap-chain texture view
 *
 * The segment buffer is a storage buffer; the vertex shader fetches by
 * `@builtin(instance_index)`. We use 6 vertices per instance (two triangles)
 * to avoid an index buffer.
 */

import type { ElisGpu } from "./device.js";
import { DRAW_WGSL } from "./shaders/draw.wgsl.js";

export const SEGMENT_BYTES = 24;

/** Camera uniform: 4x4 view-proj (column-major) + viewport size. */
export type CameraUniform = {
  /** 16 floats (mat4x4). Column-major. */
  viewProj: Float32Array;
  /** [width, height] in pixels. */
  viewport: [number, number];
}

export class LineRenderer {
  private readonly elis: ElisGpu;
  private readonly pipeline: GPURenderPipeline;
  private readonly cameraBuf: GPUBuffer;
  private segmentBuf: GPUBuffer | null = null;
  private segmentCount = 0;
  private bindGroup: GPUBindGroup | null = null;
  private readonly bindGroupLayout: GPUBindGroupLayout;

  constructor(elis: ElisGpu) {
    this.elis = elis;
    const { device, format } = elis;

    this.cameraBuf = device.createBuffer({
      label: "elise-line.camera",
      // mat4x4 (64) + viewport vec2 (8) + pad vec2 (8) = 80 bytes.
      size: 80,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    this.bindGroupLayout = device.createBindGroupLayout({
      label: "elise-line.bgl",
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
          buffer: { type: "uniform" },
        },
        {
          binding: 1,
          visibility: GPUShaderStage.VERTEX,
          buffer: { type: "read-only-storage" },
        },
      ],
    });

    const module = device.createShaderModule({
      label: "elise-line.shader",
      code: DRAW_WGSL,
    });

    this.pipeline = device.createRenderPipeline({
      label: "elise-line.pipeline",
      layout: device.createPipelineLayout({
        bindGroupLayouts: [this.bindGroupLayout],
      }),
      vertex: { module, entryPoint: "vs_main" },
      fragment: {
        module,
        entryPoint: "fs_main",
        targets: [
          {
            format,
            blend: {
              color: {
                srcFactor: "src-alpha",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
              alpha: {
                srcFactor: "one",
                dstFactor: "one-minus-src-alpha",
                operation: "add",
              },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
    });
  }

  /**
   * Upload a packed Float32Array of segments (6 floats / 24 bytes each).
   * Re-allocates the underlying buffer when the byte size changes.
   */
  setSegments(data: Float32Array): void {
    const { device } = this.elis;
    const byteLength = data.byteLength;
    if (byteLength === 0) {
      this.segmentBuf = null;
      this.segmentCount = 0;
      this.bindGroup = null;
      return;
    }
    if (!this.segmentBuf || this.segmentBuf.size < byteLength) {
      this.segmentBuf?.destroy();
      // Round up to a multiple of 4 bytes (already true for f32 data) and
      // pad to at least 256 to keep the GPU happy when very small.
      const size = Math.max(256, byteLength);
      this.segmentBuf = device.createBuffer({
        label: "elise-line.segments",
        size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      this.bindGroup = device.createBindGroup({
        label: "elise-line.bg",
        layout: this.bindGroupLayout,
        entries: [
          { binding: 0, resource: { buffer: this.cameraBuf } },
          { binding: 1, resource: { buffer: this.segmentBuf } },
        ],
      });
    }
    device.queue.writeBuffer(this.segmentBuf, 0, data.buffer, data.byteOffset, byteLength);
    this.segmentCount = byteLength / SEGMENT_BYTES;
  }

  /**
   * Bind a GPU buffer of segments directly (e.g. one produced by the GPU
   * interpreter compute pass). The buffer must already be sized correctly
   * and have `STORAGE` usage.
   */
  setSegmentBuffer(buffer: GPUBuffer, segmentCount: number): void {
    const { device } = this.elis;
    this.segmentBuf = buffer;
    this.segmentCount = segmentCount;
    this.bindGroup = device.createBindGroup({
      label: "elise-line.bg",
      layout: this.bindGroupLayout,
      entries: [
        { binding: 0, resource: { buffer: this.cameraBuf } },
        { binding: 1, resource: { buffer: this.segmentBuf } },
      ],
    });
  }

  setCamera(cam: CameraUniform): void {
    const { device } = this.elis;
    // Layout: mat4x4<f32> (64 bytes) + viewport vec2<f32> (8) + pad vec2<f32> (8).
    const buf = new ArrayBuffer(80);
    const f32 = new Float32Array(buf);
    if (cam.viewProj.length !== 16) {
      throw new Error("CameraUniform.viewProj must be a length-16 Float32Array");
    }
    f32.set(cam.viewProj, 0);
    f32[16] = cam.viewport[0];
    f32[17] = cam.viewport[1];
    f32[18] = 0;
    f32[19] = 0;
    device.queue.writeBuffer(this.cameraBuf, 0, buf);
  }

  /**
   * Record a render pass that draws the current segments to the given color
   * attachment. The caller owns the swap-chain view and the command encoder.
   */
  render(encoder: GPUCommandEncoder, colorView: GPUTextureView, clear?: GPUColor): void {
    if (!this.bindGroup || this.segmentCount === 0) {
      // Still issue a clear pass so the caller can rely on the encoder
      // having had its turn at the swap-chain.
      if (clear) {
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: colorView,
              clearValue: clear,
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });
        pass.end();
      }
      return;
    }
    const pass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: colorView,
          clearValue: clear ?? { r: 0, g: 0, b: 0, a: 1 },
          loadOp: clear ? "clear" : "load",
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(6, this.segmentCount, 0, 0);
    pass.end();
  }

  /** Number of segments currently uploaded. Useful for tests / debug HUDs. */
  get count(): number {
    return this.segmentCount;
  }

  destroy(): void {
    this.cameraBuf.destroy();
    this.segmentBuf?.destroy();
    this.segmentBuf = null;
    this.bindGroup = null;
  }
}
