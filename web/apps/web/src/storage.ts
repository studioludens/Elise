import { parseLsys, serializeLsys, type LsysFile } from "@elise/engine";

const KEY = "elise:state:v1";

export function loadState(): LsysFile | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return parseLsys(raw);
  } catch {
    return null;
  }
}

export function saveState(file: LsysFile): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(KEY, serializeLsys(file));
  } catch {
    /* quota exceeded or unavailable — ignore */
  }
}

export function clearState(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(KEY);
}
