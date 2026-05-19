export const GPU_PACKAGE_VERSION = "0.0.0";

export {
  createElisGpu,
  getRequiredFeatures,
  getRequiredLimits,
  type ElisGpu,
  type CreateElisGpuOptions,
} from "./device.js";
export { LineRenderer, SEGMENT_BYTES, type CameraUniform } from "./renderer.js";
export {
  eventsToSegments,
  packColorRgba,
  SEGMENT_FLOATS,
  SEGMENT_STRIDE,
  POLY_VERTEX_FLOATS,
  POLY_VERTEX_STRIDE,
  type SegmentBuffers,
} from "./segments.js";

/** Legacy probe — kept around for callers that imported it earlier. */
export async function requestAdapter(): Promise<GPUAdapter | null> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;
  return navigator.gpu.requestAdapter();
}
