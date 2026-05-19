import { useEffect, useState } from "react";
import { createElisGpu, LineRenderer, type ElisGpu } from "@elise/gpu";

export type WebGpuStatus = "loading" | "ready" | "unsupported" | "error";

export interface WebGpuHandle {
  status: WebGpuStatus;
  gpu: ElisGpu | null;
  renderer: LineRenderer | null;
  error: string | null;
}

export function useWebGpu(canvas: HTMLCanvasElement | null): WebGpuHandle {
  const [handle, setHandle] = useState<WebGpuHandle>({
    status: "loading",
    gpu: null,
    renderer: null,
    error: null,
  });

  useEffect(() => {
    if (!canvas) return;
    let cancelled = false;
    let madeGpu: ElisGpu | null = null;
    let madeRenderer: LineRenderer | null = null;

    if (typeof navigator === "undefined" || !("gpu" in navigator)) {
      setHandle({ status: "unsupported", gpu: null, renderer: null, error: null });
      return;
    }

    void (async () => {
      try {
        const gpu = await createElisGpu(canvas);
        if (cancelled) {
          return;
        }
        if (!gpu) {
          setHandle({ status: "unsupported", gpu: null, renderer: null, error: null });
          return;
        }
        const renderer = new LineRenderer(gpu);
        madeGpu = gpu;
        madeRenderer = renderer;
        setHandle({ status: "ready", gpu, renderer, error: null });
      } catch (err) {
        if (cancelled) return;
        setHandle({
          status: "error",
          gpu: null,
          renderer: null,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    })();

    return () => {
      cancelled = true;
      madeRenderer?.destroy();
      madeGpu?.device.destroy();
    };
  }, [canvas]);

  return handle;
}
