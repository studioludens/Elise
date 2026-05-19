import { expect, test } from "vitest";
import { ENGINE_VERSION } from "../src/index.js";

test("engine module loads", () => {
  expect(ENGINE_VERSION).toBe("0.0.0");
});
