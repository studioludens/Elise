import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { App } from "../src/App.js";
import { PRESETS } from "@elise/engine";

// jsdom doesn't implement canvas; stub getContext so the canvas component
// doesn't crash during mount.
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as never;
  // ResizeObserver is not in jsdom.
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

describe("App", () => {
  test("mounts and renders the canvas", () => {
    render(<App />);
    expect(screen.getByTestId("lsystem-canvas")).toBeInTheDocument();
  });

  test("loads the Koch curve preset by default", () => {
    render(<App />);
    const axiom = screen.getByLabelText(/^Axiom$/i) as HTMLInputElement;
    const koch = PRESETS[0]!;
    expect(axiom.value).toBe(koch.axiom);
  });

  test("selecting a preset populates axiom + rules fields", () => {
    render(<App />);
    const select = screen.getByLabelText(/^Preset$/i) as HTMLSelectElement;
    const plant = PRESETS.find((p) => p.name === "Plant")!;
    fireEvent.change(select, { target: { value: plant.name } });
    const axiom = screen.getByLabelText(/^Axiom$/i) as HTMLInputElement;
    const rules = screen.getByLabelText(/^Rules/i) as HTMLTextAreaElement;
    expect(axiom.value).toBe(plant.axiom);
    expect(rules.value).toContain(plant.rules[0]!.axiom + ":" + plant.rules[0]!.rule);
  });

  test("editing rules updates the parsed rule count", () => {
    render(<App />);
    const rules = screen.getByLabelText(/^Rules/i) as HTMLTextAreaElement;
    fireEvent.change(rules, { target: { value: "F:F+F\nG:G-G" } });
    expect(screen.getByTestId("rule-count").textContent).toBe("2 rules");
    fireEvent.change(rules, { target: { value: "X:XX" } });
    expect(screen.getByTestId("rule-count").textContent).toBe("1 rule");
  });

  test("bogus axiom with no matching rules still renders", () => {
    render(<App />);
    const axiom = screen.getByLabelText(/^Axiom$/i) as HTMLInputElement;
    fireEvent.change(axiom, { target: { value: "ZZZ" } });
    // No rules match Z, so rewrite is a no-op; interpret skips Z; should not throw.
    expect(screen.getByTestId("lsystem-canvas")).toBeInTheDocument();
  });

  test("export SVG creates a blob whose contents start with <svg", () => {
    let captured = "";
    const RealBlob = globalThis.Blob;
    class CapturingBlob extends RealBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        for (const p of parts) {
          if (typeof p === "string") captured += p;
        }
      }
    }
    (globalThis as { Blob: typeof Blob }).Blob = CapturingBlob as never;
    URL.createObjectURL = vi.fn(() => "blob:fake") as never;
    URL.revokeObjectURL = vi.fn() as never;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /export svg/i }));

    expect(captured.startsWith("<svg")).toBe(true);

    clickSpy.mockRestore();
    (globalThis as { Blob: typeof Blob }).Blob = RealBlob;
  });

  test("reset to preset restores axiom after edits", () => {
    render(<App />);
    const select = screen.getByLabelText(/^Preset$/i) as HTMLSelectElement;
    const dragon = PRESETS.find((p) => p.name === "Dragon curve")!;
    fireEvent.change(select, { target: { value: dragon.name } });
    const axiom = screen.getByLabelText(/^Axiom$/i) as HTMLInputElement;
    fireEvent.change(axiom, { target: { value: "GARBAGE" } });
    expect(axiom.value).toBe("GARBAGE");
    fireEvent.click(screen.getByRole("button", { name: /reset to preset/i }));
    expect(
      (screen.getByLabelText(/^Axiom$/i) as HTMLInputElement).value,
    ).toBe(dragon.axiom);
  });

  test("changing angle slider updates the value field", () => {
    render(<App />);
    const angleNum = screen.getByLabelText(/Angle value/i) as HTMLInputElement;
    fireEvent.change(angleNum, { target: { value: "45" } });
    expect((screen.getByLabelText(/Angle value/i) as HTMLInputElement).value).toBe(
      "45",
    );
  });
});
