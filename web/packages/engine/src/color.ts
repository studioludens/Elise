export type HSV = {
  h: number;
  s: number;
  v: number;
}

export type RGB = {
  r: number;
  g: number;
  b: number;
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  if (s === 0) {
    const c = Math.round(v * 255);
    return { r: c, g: c, b: c };
  }
  let hh = h * 6;
  if (hh >= 6) hh = 0;
  const i = Math.floor(hh);
  const f = hh - i;
  const p = v * (1 - s);
  const q = v * (1 - s * f);
  const t = v * (1 - s * (1 - f));
  let rf: number, gf: number, bf: number;
  switch (i) {
    case 0: rf = v; gf = t; bf = p; break;
    case 1: rf = q; gf = v; bf = p; break;
    case 2: rf = p; gf = v; bf = t; break;
    case 3: rf = p; gf = q; bf = v; break;
    case 4: rf = t; gf = p; bf = v; break;
    default: rf = v; gf = p; bf = q; break;
  }
  return {
    r: Math.round(rf * 255),
    g: Math.round(gf * 255),
    b: Math.round(bf * 255),
  };
}

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const min = Math.min(rf, gf, bf);
  const max = Math.max(rf, gf, bf);
  const delta = max - min;
  const v = max;
  if (delta === 0) return { h: 0, s: 0, v };
  const s = delta / max;
  const dr = ((max - rf) / 6 + delta / 2) / delta;
  const dg = ((max - gf) / 6 + delta / 2) / delta;
  const db = ((max - bf) / 6 + delta / 2) / delta;
  let h: number;
  if (rf === max) h = db - dg;
  else if (gf === max) h = 1 / 3 + dr - db;
  else h = 2 / 3 + dg - dr;
  if (h < 0) h += 1;
  if (h > 1) h -= 1;
  return { h, s, v };
}

export function rgbToHex({ r, g, b }: RGB): number {
  return ((r & 0xff) << 16) | ((g & 0xff) << 8) | (b & 0xff);
}

export function hexToRgb(hex: number): RGB {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff,
  };
}

export function hsvToHex(hsv: HSV): number {
  return rgbToHex(hsvToRgb(hsv));
}
