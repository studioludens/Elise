import { afterEach, beforeEach, describe, expect, test } from "vitest";
import type { LsysFile } from "@elise/engine";
import { clearState, loadState, saveState } from "../src/storage.js";

const SAMPLE: LsysFile = {
  name: "Test",
  axiom: "F",
  rules: [{ axiom: "F", rule: "F+F" }],
  params: {
    angle: 60,
    iterations: 3,
    ratio: 0.99,
    initialLineLength: 10,
    initialLineThickness: 1,
    hsv: { h: 0, s: 0, v: 0 },
  },
};

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("storage", () => {
  test("save then load round-trips the file", () => {
    saveState(SAMPLE);
    const loaded = loadState();
    expect(loaded?.axiom).toBe(SAMPLE.axiom);
    expect(loaded?.rules).toEqual(SAMPLE.rules);
    expect(loaded?.params.angle).toBe(60);
  });

  test("loadState returns null when nothing saved", () => {
    expect(loadState()).toBeNull();
  });

  test("loadState returns null for corrupt input", () => {
    localStorage.setItem("elise:state:v1", "not xml at all");
    expect(loadState()).toBeNull();
  });

  test("clearState removes the slot", () => {
    saveState(SAMPLE);
    clearState();
    expect(loadState()).toBeNull();
  });
});
