export const GPU_PACKAGE_VERSION = '0.0.0';

export {
    createElisGpu,
    getRequiredFeatures,
    getRequiredLimits,
    type ElisGpu,
    type CreateElisGpuOptions,
} from './device';
export { LineRenderer, SEGMENT_BYTES, type CameraUniform } from './renderer';
export {
    eventsToSegments,
    packColorRgba,
    SEGMENT_FLOATS,
    SEGMENT_STRIDE,
    POLY_VERTEX_FLOATS,
    POLY_VERTEX_STRIDE,
    type SegmentBuffers,
} from './segments';
export { rewriteOnGpu, type RewriteOptions } from './rewrite-gpu';
export { interpretOnGpu, type InterpretGpuResult } from './interpret-gpu';
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
} from './tokens-gpu';

/** Legacy probe — kept around for callers that imported it earlier. */
export async function requestAdapter(): Promise<GPUAdapter | null> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) return null;
    return navigator.gpu.requestAdapter();
}
