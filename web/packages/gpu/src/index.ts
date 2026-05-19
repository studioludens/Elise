export const GPU_PACKAGE_VERSION = "0.0.0";

export async function requestAdapter(): Promise<GPUAdapter | null> {
  if (!("gpu" in navigator)) return null;
  return navigator.gpu.requestAdapter();
}
