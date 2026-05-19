import { afterEach, describe, expect, test } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { DrawEvent } from "@elise/engine";
import { StatsHud } from "../src/components/StatsHud.js";

const EVENTS: DrawEvent[] = [
  { kind: "style", color: 0x000000, thickness: 1 },
  { kind: "line", x0: 0, y0: 0, x1: 1, y1: 0, color: 0, thickness: 1 },
  { kind: "line", x0: 1, y0: 0, x1: 2, y1: 0, color: 0, thickness: 1 },
  { kind: "poly-start", x: 0, y: 0, color: 0 },
  { kind: "poly-end" },
];

afterEach(cleanup);

describe("StatsHud", () => {
  test("renders counts and timings", () => {
    render(
      <StatsHud
        events={EVENTS}
        systemLength={42}
        rewriteMs={1.5}
        interpretMs={0.25}
      />,
    );
    const hud = screen.getByTestId("stats-hud");
    expect(hud.textContent).toContain("42");
    expect(hud.textContent).toMatch(/lines.*2/);
    expect(hud.textContent).toMatch(/polys.*1/);
    expect(hud.textContent).toContain("1.5 ms");
  });

  test("formats sub-millisecond times in microseconds", () => {
    render(
      <StatsHud
        events={[]}
        systemLength={0}
        rewriteMs={0.012}
        interpretMs={0.034}
      />,
    );
    expect(screen.getByTestId("stats-hud").textContent).toMatch(/12 µs/);
  });
});
