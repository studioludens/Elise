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
export { rewriteOnGpu, type RewriteOptions } from "./rewrite-gpu.js";
export {
  interpretOnGpu,
  type InterpretGpuResult,
} from "./interpret-gpu.js";
export {
  encodeTokens,
  decodeTokens,
  tokensToString,
  isNoArg,
  noArgValue,
  u32ToF32Bits,
  f32BitsToU32,
  TOKEN_STRIDE,
  NO_ARG_BITS,
  type EncodedTokens,
  type DecodedToken,
} from "./tokens-gpu.js";

/** Legacy probe — kept around for callers that imported it earlier. */
export async function requestAdapter(): Promise<GPUAdapter | null> {
  if (typeof navigator === "undefined" || !("gpu" in navigator)) return null;
  return navigator.gpu.requestAdapter();
}
