import type { DrawEvent } from "@elise/engine";

export type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Affine view: screen = world * scale + (offsetX, offsetY).
 * `offsetX/Y` are in CSS pixels.
 */
export type View = {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function computeBounds(events: readonly DrawEvent[]): Bounds {
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

export function fitView(
  bounds: Bounds,
  width: number,
  height: number,
  padding: number,
): View {
  const dx = bounds.maxX - bounds.minX || 1;
  const dy = bounds.maxY - bounds.minY || 1;
  const scale = Math.min(
    (width - 2 * padding) / dx,
    (height - 2 * padding) / dy,
  );
  const offsetX = padding - bounds.minX * scale + (width - 2 * padding - dx * scale) / 2;
  const offsetY = padding - bounds.minY * scale + (height - 2 * padding - dy * scale) / 2;
  return { scale, offsetX, offsetY };
}

/**
 * Zoom the view by `factor` while keeping the screen point `(sx, sy)` fixed.
 */
export function zoomAt(view: View, factor: number, sx: number, sy: number): View {
  const scale = view.scale * factor;
  // sx = worldX * view.scale + view.offsetX  =>  worldX = (sx - view.offsetX)/view.scale
  // After zoom: sx = worldX * scale + offsetX'  =>  offsetX' = sx - worldX * scale
  const offsetX = sx - ((sx - view.offsetX) / view.scale) * scale;
  const offsetY = sy - ((sy - view.offsetY) / view.scale) * scale;
  return { scale, offsetX, offsetY };
}

function colorToCss(hex: number): string {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgb(${r},${g},${b})`;
}

const arcWarning = { warned: false };

/**
 * Render an event stream into a 2D context. The canvas is assumed to be
 * `cssWidth x cssHeight` CSS pixels with backing store sized for `dpr`.
 */
export function renderEvents(
  ctx: CanvasRenderingContext2D,
  events: readonly DrawEvent[],
  view: View,
  cssWidth: number,
  cssHeight: number,
  dpr: number,
  background = "#ffffff",
): void {
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  // Compose: screen = world * scale + offset.
  ctx.translate(view.offsetX, view.offsetY);
  ctx.scale(view.scale, view.scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  let strokeColor = colorToCss(0);
  let strokeWidth = 1;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth / view.scale;

  let polyOpen = false;
  let polyPts: Array<{ x: number; y: number }> = [];
  let polyColor = 0;

  let pathOpen = false;
  let cursorX = NaN;
  let cursorY = NaN;
  const beginPath = () => {
    if (!pathOpen) {
      ctx.beginPath();
      pathOpen = true;
    }
  };
  const flushStroke = () => {
    if (pathOpen) {
      ctx.stroke();
      pathOpen = false;
      cursorX = NaN;
      cursorY = NaN;
    }
  };

  for (const e of events) {
    switch (e.kind) {
      case "style": {
        flushStroke();
        strokeColor = colorToCss(e.color);
        strokeWidth = e.thickness;
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(strokeWidth / view.scale, 0.0001);
        break;
      }
      case "line": {
        beginPath();
        if (cursorX !== e.x0 || cursorY !== e.y0) ctx.moveTo(e.x0, e.y0);
        ctx.lineTo(e.x1, e.y1);
        cursorX = e.x1;
        cursorY = e.y1;
        break;
      }
      case "move":
        cursorX = NaN;
        cursorY = NaN;
        break;
      case "arc":
        if (!arcWarning.warned) {
          arcWarning.warned = true;
          // eslint-disable-next-line no-console
          console.warn("[canvas2d] arc events are not rendered in milestone 4");
        }
        break;
      case "poly-start":
        flushStroke();
        polyOpen = true;
        polyColor = e.color;
        polyPts = [{ x: e.x, y: e.y }];
        break;
      case "poly-point":
        if (polyOpen) polyPts.push({ x: e.x, y: e.y });
        break;
      case "poly-end": {
        if (polyOpen && polyPts.length > 0) {
          ctx.save();
          ctx.globalAlpha = 0.4;
          ctx.fillStyle = colorToCss(polyColor);
          ctx.beginPath();
          const first = polyPts[0]!;
          ctx.moveTo(first.x, first.y);
          for (let k = 1; k < polyPts.length; k++) {
            const p = polyPts[k]!;
            ctx.lineTo(p.x, p.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }
        polyOpen = false;
        polyPts = [];
        break;
      }
    }
  }
  flushStroke();
  ctx.restore();
}
