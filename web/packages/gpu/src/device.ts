/**
 * WebGPU bootstrap. Acquires an adapter + device, configures the canvas
 * context, and returns a small struct that other modules in this package can
 * pass around.
 *
 * Returns `null` if WebGPU is unavailable on this host (no `navigator.gpu`,
 * no adapter, or `requestDevice` rejects). Callers are responsible for falling
 * back to a CPU/Canvas2D renderer.
 */

export type ElisGpu = {
    /** Active WebGPU device. */
    readonly device: GPUDevice;
    /** The canvas-bound context, already configured for `format`. */
    readonly context: GPUCanvasContext;
    /** Preferred swap-chain format. */
    readonly format: GPUTextureFormat;
    /** Canvas the context was created from. */
    readonly canvas: HTMLCanvasElement;
};

export type CreateElisGpuOptions = {
    /** Optional feature names to pass to `requestDevice`. */
    requiredFeatures?: GPUFeatureName[];
    /** Optional limit overrides for `requestDevice`. */
    requiredLimits?: Record<string, number>;
    /** Force a specific texture format. Default: `getPreferredCanvasFormat()`. */
    format?: GPUTextureFormat;
    /** Alpha mode for the canvas context. Default: `"opaque"`. */
    alphaMode?: GPUCanvasAlphaMode;
    /**
     * Power-preference hint passed to `requestAdapter`. Default: undefined
     * (let the browser pick).
     */
    powerPreference?: GPUPowerPreference;
};

/**
 * Default features (empty) — overridable via options. Surfaced as a function so
 * apps can wrap us and add their own without forking the package.
 */
export function getRequiredFeatures(): GPUFeatureName[] {
    return [];
}

/** Default limits (empty) — overridable via options. */
export function getRequiredLimits(): Record<string, number> {
    return {};
}

export async function createElisGpu(
    canvas: HTMLCanvasElement,
    options: CreateElisGpuOptions = {},
): Promise<ElisGpu | null> {
    if (typeof navigator === 'undefined' || !('gpu' in navigator)) return null;
    const gpu = navigator.gpu;
    if (!gpu) return null;

    let adapter: GPUAdapter | null;
    try {
        adapter = await gpu.requestAdapter(
            options.powerPreference !== undefined
                ? { powerPreference: options.powerPreference }
                : {},
        );
    } catch {
        return null;
    }
    if (!adapter) return null;

    const features = options.requiredFeatures ?? getRequiredFeatures();
    const limits = options.requiredLimits ?? getRequiredLimits();

    let device: GPUDevice;
    try {
        device = await adapter.requestDevice({
            requiredFeatures: features,
            requiredLimits: limits,
        });
    } catch {
        return null;
    }

    const context = canvas.getContext('webgpu');
    if (!context) return null;

    const format = options.format ?? gpu.getPreferredCanvasFormat();
    context.configure({
        device,
        format,
        alphaMode: options.alphaMode ?? 'opaque',
    });

    return { device, context, format, canvas };
}
