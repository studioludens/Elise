import type { DrawEvent } from "./interpret.js";

export type SvgExportOptions = {
  width?: number;
  height?: number;
  padding?: number;
  background?: string | null;
}

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function computeBounds(events: DrawEvent[]): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const e of events) {
    switch (e.kind) {
      case "line":
      case "arc":
        visit(e.x0, e.y0);
        visit(e.x1, e.y1);
        break;
      case "move":
      case "poly-start":
      case "poly-point":
        visit(e.x, e.y);
        break;
    }
  }
  if (!isFinite(minX)) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  return { minX, minY, maxX, maxY };
}

function formatColor(hex: number): string {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgb(${r},${g},${b})`;
}

function fmt(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(3);
}

export function exportSvg(events: DrawEvent[], options: SvgExportOptions = {}): string {
  const width = options.width ?? 800;
  const height = options.height ?? 800;
  const padding = options.padding ?? 16;

  const bounds = computeBounds(events);
  const dx = bounds.maxX - bounds.minX || 1;
  const dy = bounds.maxY - bounds.minY || 1;
  const scale = Math.min(
    (width - 2 * padding) / dx,
    (height - 2 * padding) / dy,
  );
  const offsetX = padding - bounds.minX * scale + (width - 2 * padding - dx * scale) / 2;
  const offsetY = padding - bounds.minY * scale + (height - 2 * padding - dy * scale) / 2;

  const sx = (x: number) => fmt(x * scale + offsetX);
  const sy = (y: number) => fmt(y * scale + offsetY);

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`);
  if (options.background) {
    parts.push(`<rect width="${width}" height="${height}" fill="${options.background}"/>`);
  }

  let path = "";
  let currentColor = 0x000000;
  let currentThickness = 1;
  let pathStarted = false;
  let cursorX = 0;
  let cursorY = 0;

  const flushPath = () => {
    if (path.length > 0) {
      parts.push(
        `<path fill="none" stroke="${formatColor(currentColor)}" stroke-width="${fmt(Math.max(currentThickness * scale, 0.001))}" d="${path}"/>`,
      );
    }
    path = "";
    pathStarted = false;
  };

  const ensureMove = (x: number, y: number) => {
    if (!pathStarted || cursorX !== x || cursorY !== y) {
      path += `M${sx(x)},${sy(y)}`;
      cursorX = x;
      cursorY = y;
      pathStarted = true;
    }
  };

  let polyOpen = false;
  let polyPoints: Array<{ x: number; y: number }> = [];
  let polyColor = 0;

  for (const e of events) {
    switch (e.kind) {
      case "style":
        flushPath();
        currentColor = e.color;
        currentThickness = e.thickness;
        break;
      case "line":
        ensureMove(e.x0, e.y0);
        path += `L${sx(e.x1)},${sy(e.y1)}`;
        cursorX = e.x1;
        cursorY = e.y1;
        break;
      case "move":
        ensureMove(e.x, e.y);
        break;
      case "arc": {
        ensureMove(e.x0, e.y0);
        const r = fmt(e.radius * scale);
        path += `A${r},${r} 0 ${e.large ? 1 : 0},${e.sweep ? 1 : 0} ${sx(e.x1)},${sy(e.y1)}`;
        cursorX = e.x1;
        cursorY = e.y1;
        break;
      }
      case "poly-start":
        polyOpen = true;
        polyPoints = [{ x: e.x, y: e.y }];
        polyColor = e.color;
        break;
      case "poly-point":
        if (polyOpen) polyPoints.push({ x: e.x, y: e.y });
        break;
      case "poly-end": {
        if (polyOpen && polyPoints.length > 0) {
          const d = polyPoints
            .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.y)}`)
            .join("");
          parts.push(`<path fill="${formatColor(polyColor)}" fill-opacity="0.4" d="${d}Z"/>`);
        }
        polyOpen = false;
        polyPoints = [];
        break;
      }
    }
  }
  flushPath();

  parts.push(`</svg>`);
  return parts.join("");
}
