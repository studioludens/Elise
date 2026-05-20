import { describe, expect, test } from "vitest";
import { InvalidLsysError, parseLsys, serializeLsys, type LsysFile } from "../src/lsys.js";

const SAMPLE: LsysFile = {
  name: "Koch curve",
  axiom: "F",
  rules: [{ axiom: "F", rule: "F+F--F+F" }],
  params: {
    angle: 60,
    iterations: 4,
    ratio: 0.99,
    initialLineLength: 10,
    initialLineThickness: 1,
    hsv: { h: 0, s: 0.7, v: 1 },
  },
};

describe("lsys file format", () => {
  test("round-trips a sample file", () => {
    const xml = serializeLsys(SAMPLE);
    const parsed = parseLsys(xml);
    expect(parsed.axiom).toBe(SAMPLE.axiom);
    expect(parsed.rules).toEqual(SAMPLE.rules);
    expect(parsed.params.angle).toBe(SAMPLE.params.angle);
    expect(parsed.params.iterations).toBe(SAMPLE.params.iterations);
    expect(parsed.params.ratio).toBeCloseTo(SAMPLE.params.ratio, 6);
    expect(parsed.params.initialLineLength).toBe(SAMPLE.params.initialLineLength);
    expect(parsed.params.initialLineThickness).toBe(SAMPLE.params.initialLineThickness);
    // HSV survives within rounding tolerance of an 8-bit RGB hex.
    expect(parsed.params.hsv.h).toBeCloseTo(SAMPLE.params.hsv.h, 2);
    expect(parsed.params.hsv.s).toBeCloseTo(SAMPLE.params.hsv.s, 2);
    expect(parsed.params.hsv.v).toBeCloseTo(SAMPLE.params.hsv.v, 2);
    expect(parsed.name).toBe("Koch curve");
  });

  test("escapes XML metacharacters in rules", () => {
    const tricky: LsysFile = {
      ...SAMPLE,
      rules: [{ axiom: "F", rule: "F<F>F&F" }],
    };
    const xml = serializeLsys(tricky);
    expect(xml).toContain("F&lt;F&gt;F&amp;F");
    expect(parseLsys(xml).rules[0]!.rule).toBe("F<F>F&F");
  });

  test("parses without optional <name>", () => {
    const { name: _name, ...withoutName } = SAMPLE;
    void _name;
    const xml = serializeLsys(withoutName as LsysFile);
    expect(parseLsys(xml).name).toBeUndefined();
  });

  test("rejects input that isn't an lsystem file", () => {
    expect(() => parseLsys("<svg></svg>")).toThrowError(InvalidLsysError);
  });

  test("rejects missing <axiom>", () => {
    expect(() => parseLsys("<lsystem><rules></rules></lsystem>")).toThrowError(InvalidLsysError);
  });

  test("falls back to defaults for missing param tags", () => {
    const minimal = `<?xml version="1.0"?><lsystem><rules><axiom>F</axiom><commands>F:FF</commands></rules></lsystem>`;
    const file = parseLsys(minimal);
    expect(file.axiom).toBe("F");
    expect(file.rules).toEqual([{ axiom: "F", rule: "FF" }]);
    expect(file.params.angle).toBe(60);
    expect(file.params.iterations).toBe(3);
  });
});
