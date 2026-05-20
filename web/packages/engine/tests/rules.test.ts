import { describe, expect, test } from "vitest";
import { parseRule, parseRules, serializeRules } from "../src/rules.js";

describe("parseRule", () => {
  test("parses simple rule", () => {
    expect(parseRule("F:F+F--F+F")).toEqual({ axiom: "F", rule: "F+F--F+F" });
  });

  test("strips whitespace", () => {
    expect(parseRule("  X : X+YF+ ")).toEqual({ axiom: "X", rule: "X+YF+" });
  });

  test("rejects missing colon", () => {
    expect(parseRule("F=F+F")).toBeNull();
  });

  test("rejects empty", () => {
    expect(parseRule("")).toBeNull();
    expect(parseRule(" ")).toBeNull();
  });
});

describe("parseRules", () => {
  test("splits on newlines and CR", () => {
    const text = "F:F+F\nX:XY\rG:GG";
    expect(parseRules(text)).toEqual([
      { axiom: "F", rule: "F+F" },
      { axiom: "X", rule: "XY" },
      { axiom: "G", rule: "GG" },
    ]);
  });

  test("skips invalid lines", () => {
    expect(parseRules("F:F+F\nbroken\nX:XY")).toEqual([
      { axiom: "F", rule: "F+F" },
      { axiom: "X", rule: "XY" },
    ]);
  });
});

describe("serializeRules", () => {
  test("round-trips", () => {
    const rules = [
      { axiom: "F", rule: "F+F" },
      { axiom: "X", rule: "XY" },
    ];
    expect(parseRules(serializeRules(rules))).toEqual(rules);
  });
});
