import { describe, expect, test } from "vitest";
import { Turtle } from "../src/turtle.js";

const EPS = 1e-9;

describe("Turtle", () => {
  test("default heading is +Y inverted (up on screen)", () => {
    const t = new Turtle({ initialLineLength: 10 });
    t.moveForward();
    expect(t.x).toBeCloseTo(0, 9);
    expect(t.y).toBeCloseTo(-10, 9);
  });

  test("rotateRight 90° heads +X", () => {
    const t = new Turtle({ initialLineLength: 10 });
    t.rotateRight(90);
    t.moveForward();
    expect(t.x).toBeCloseTo(10, 9);
    expect(t.y).toBeCloseTo(0, 9);
  });

  test("push/pop restores state", () => {
    const t = new Turtle({ initialLineLength: 10 });
    t.moveForward();
    t.pushState();
    t.rotateRight(45);
    t.moveForward();
    t.popState();
    expect(t.x).toBeCloseTo(0, 9);
    expect(t.y).toBeCloseTo(-10, 9);
    expect(t.angle).toBeCloseTo(0, 9);
  });

  test("pop on empty stack is a no-op", () => {
    const t = new Turtle();
    expect(() => t.popState()).not.toThrow();
  });

  test("rotateLeft + rotateRight cancel", () => {
    const t = new Turtle();
    t.rotateLeft(33);
    t.rotateRight(33);
    expect(Math.abs(t.angle)).toBeLessThan(EPS);
  });

  test("brightness up/down move toward and away from 1", () => {
    const t = new Turtle({ initialHsv: { h: 0, s: 0.5, v: 0.5 } });
    const before = t.hsv.v;
    t.brightnessUp();
    expect(t.hsv.v).toBeGreaterThan(before);
    t.brightnessDown();
    expect(t.hsv.v).toBeLessThan(before + EPS);
  });
});
