import type { HSV } from "./color.js";
import { hexToRgb, hsvToHex, rgbToHsv } from "./color.js";
import type { Rule } from "./rules.js";
import { parseRules, serializeRules } from "./rules.js";

export type LsysFile = {
  /** Optional display name (preset / file name without extension). */
  name?: string;
  axiom: string;
  rules: Rule[];
  params: {
    angle: number;
    iterations: number;
    ratio: number;
    initialLineLength: number;
    initialLineThickness: number;
    hsv: HSV;
  };
};

export class InvalidLsysError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLsysError";
  }
}

const escapeMap: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const unescapeMap: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
};

function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => escapeMap[c]!);
}

function unescapeXml(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|apos);/g, (m) => unescapeMap[m]!);
}

function tagValue(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const m = re.exec(xml);
  return m ? unescapeXml(m[1]!) : null;
}

function num(s: string | null, fallback: number): number {
  if (s === null) return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

function hexToHsv(hex: string): HSV {
  const trimmed = hex.trim().replace(/^#/, "");
  const value = parseInt(trimmed, 16);
  if (!Number.isFinite(value)) return { h: 0, s: 0, v: 0 };
  return rgbToHsv(hexToRgb(value));
}

export function serializeLsys(file: LsysFile): string {
  const { name, axiom, rules, params } = file;
  const commands = serializeRules(rules);
  const lineColor = `#${hsvToHex(params.hsv).toString(16).padStart(6, "0")}`;
  const lines = [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<lsystem version="1">`,
  ];
  if (name) lines.push(`  <name>${escapeXml(name)}</name>`);
  lines.push(
    `  <rules>`,
    `    <axiom>${escapeXml(axiom)}</axiom>`,
    `    <commands>${escapeXml(commands)}</commands>`,
    `  </rules>`,
    `  <params>`,
    `    <angle>${params.angle}</angle>`,
    `    <iterations>${params.iterations}</iterations>`,
    `    <ratio>${params.ratio}</ratio>`,
    `    <lineLength>${params.initialLineLength}</lineLength>`,
    `    <lineThickness>${params.initialLineThickness}</lineThickness>`,
    `    <lineColor>${lineColor}</lineColor>`,
    `  </params>`,
    `</lsystem>`,
    ``,
  );
  return lines.join("\n");
}

export function parseLsys(text: string): LsysFile {
  if (!/<lsystem(\s|>)/.test(text)) {
    throw new InvalidLsysError("missing <lsystem> root element");
  }
  const axiom = tagValue(text, "axiom");
  if (axiom === null) throw new InvalidLsysError("missing <axiom>");
  const commandsRaw = tagValue(text, "commands") ?? "";
  const rules = parseRules(commandsRaw);
  const lineColor = tagValue(text, "lineColor");
  const hsv = lineColor ? hexToHsv(lineColor) : { h: 0, s: 0, v: 0 };

  const file: LsysFile = {
    axiom,
    rules,
    params: {
      angle: num(tagValue(text, "angle"), 60),
      iterations: num(tagValue(text, "iterations"), 3),
      ratio: num(tagValue(text, "ratio"), 0.99),
      initialLineLength: num(tagValue(text, "lineLength"), 10),
      initialLineThickness: num(tagValue(text, "lineThickness"), 1),
      hsv,
    },
  };
  const name = tagValue(text, "name");
  if (name) file.name = name;
  return file;
}
