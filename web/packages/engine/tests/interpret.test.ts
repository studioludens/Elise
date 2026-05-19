import { describe, expect, test } from "vitest";
import { interpret, type DrawEvent } from "../src/interpret.js";
import { rewrite } from "../src/rewrite.js";
import { PRESETS } from "../src/presets.js";

const countLines = (events: DrawEvent[]) => events.filter((e) => e.kind === "line").length;

describe("interpret", () => {
  test("F draws a single line of the configured length", () => {
    const events = interpret("F", { initialLineLength: 10 });
    const lines = events.filter((e): e is Extract<DrawEvent, { kind: "line" }> => e.kind === "line");
    expect(lines).toHaveLength(1);
    const [line] = lines;
    expect(line!.x0).toBeCloseTo(0, 9);
    expect(line!.y0).toBeCloseTo(0, 9);
    expect(line!.x1).toBeCloseTo(0, 9);
    expect(line!.y1).toBeCloseTo(-10, 9);
  });

  test("Koch curve segment count grows as 4^n", () => {
    const koch = PRESETS.find((p) => p.name === "Koch curve")!;
    for (let i = 0; i <= 3; i++) {
      const sys = rewrite(koch.axiom, koch.rules, i);
      const events = interpret(sys, { angle: koch.angle, initialLineLength: 1 });
      expect(countLines(events)).toBe(Math.pow(4, i));
    }
  });

  test("parametric F(0.5) moves half a line length", () => {
    const events = interpret("F(0.5)", { initialLineLength: 10 });
    const line = events.find((e): e is Extract<DrawEvent, { kind: "line" }> => e.kind === "line")!;
    expect(line.y1).toBeCloseTo(-5, 9);
  });

  test("bracket subtree leaves no net displacement", () => {
    const events = interpret("[+F+F]", { angle: 45, initialLineLength: 10 });
    const last = events.at(-1)!;
    expect(last.kind).toBe("move");
    if (last.kind === "move") {
      expect(last.x).toBeCloseTo(0, 9);
      expect(last.y).toBeCloseTo(0, 9);
    }
  });

  test("polygon { . . } produces start, points, and end", () => {
    const events = interpret("{.F.F.}", { angle: 90, initialLineLength: 5 });
    const kinds = events.map((e) => e.kind);
    expect(kinds).toContain("poly-start");
    expect(kinds).toContain("poly-point");
    expect(kinds).toContain("poly-end");
  });

  test("all presets produce at least one line at small iteration counts", () => {
    for (const preset of PRESETS) {
      const sys = rewrite(preset.axiom, preset.rules, Math.min(preset.iterations, 3));
      const events = interpret(sys, { angle: preset.angle, initialLineLength: 1 });
      expect(countLines(events)).toBeGreaterThan(0);
    }
  });
});
