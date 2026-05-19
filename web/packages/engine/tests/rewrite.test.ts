import { describe, expect, test } from "vitest";
import { MaxLengthExceededError, rewrite } from "../src/rewrite.js";

describe("rewrite", () => {
  test("zero iterations returns axiom", () => {
    expect(rewrite("F", [{ axiom: "F", rule: "FF" }], 0)).toBe("F");
  });

  test("Koch curve at iterations 1 and 2", () => {
    const rules = [{ axiom: "F", rule: "F+F--F+F" }];
    expect(rewrite("F", rules, 1)).toBe("F+F--F+F");
    expect(rewrite("F", rules, 2)).toBe("F+F--F+F+F+F--F+F--F+F--F+F+F+F--F+F");
  });

  test("Dragon curve at iteration 3", () => {
    const rules = [
      { axiom: "X", rule: "X+YF+" },
      { axiom: "Y", rule: "-FX-Y" },
    ];
    expect(rewrite("FX", rules, 3)).toBe(
      "FX+YF++-FX-YF++-FX+YF+--FX-YF+",
    );
  });

  test("only first matching rule fires per symbol", () => {
    const rules = [
      { axiom: "F", rule: "A" },
      { axiom: "F", rule: "B" },
    ];
    expect(rewrite("F", rules, 1)).toBe("A");
  });

  test("skips parametric argument blocks during rewriting", () => {
    const rules = [{ axiom: "F", rule: "FF" }];
    expect(rewrite("F(0.5)", rules, 1)).toBe("FF(0.5)");
    expect(rewrite("F(0.5)+F", rules, 1)).toBe("FF(0.5)+FF");
  });

  test("respects max length", () => {
    const rules = [{ axiom: "F", rule: "FF" }];
    expect(() => rewrite("F", rules, 20, { maxLength: 100 }))
      .toThrowError(MaxLengthExceededError);
  });

  test("non-rule symbols pass through unchanged", () => {
    const rules = [{ axiom: "F", rule: "FF" }];
    expect(rewrite("F+F-[F]", rules, 1)).toBe("FF+FF-[FF]");
  });
});
