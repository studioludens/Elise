import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, cleanup, waitFor } from "@testing-library/react";
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
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
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

  test("save .lsys then open .lsys round-trips axiom + rules", async () => {
    let savedXml = "";
    const RealBlob = globalThis.Blob;
    class CapturingBlob extends RealBlob {
      constructor(parts: BlobPart[], opts?: BlobPropertyBag) {
        super(parts, opts);
        for (const p of parts) if (typeof p === "string") savedXml += p;
      }
    }
    (globalThis as { Blob: typeof Blob }).Blob = CapturingBlob as never;
    URL.createObjectURL = vi.fn(() => "blob:fake") as never;
    URL.revokeObjectURL = vi.fn() as never;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<App />);
    const dragon = PRESETS.find((p) => p.name === "Dragon curve")!;
    fireEvent.change(screen.getByLabelText(/^Preset$/i), {
      target: { value: dragon.name },
    });

    fireEvent.click(screen.getByRole("button", { name: /save \.lsys/i }));
    expect(savedXml).toContain("<lsystem");
    expect(savedXml).toContain(`<axiom>${dragon.axiom}</axiom>`);

    // Mutate the editor, then reload the saved file and verify restoration.
    fireEvent.change(screen.getByLabelText(/^Axiom$/i), {
      target: { value: "ZZZ" },
    });
    expect((screen.getByLabelText(/^Axiom$/i) as HTMLInputElement).value).toBe("ZZZ");

    const input = screen.getByTestId("lsys-file-input") as HTMLInputElement;
    const file = new File([savedXml], "dragon.lsys", { type: "application/xml" });
    // jsdom's File doesn't reliably implement async text(); pin it.
    (file as unknown as { text: () => Promise<string> }).text = () =>
      Promise.resolve(savedXml);
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);

    await waitFor(() =>
      expect((screen.getByLabelText(/^Axiom$/i) as HTMLInputElement).value).toBe(
        dragon.axiom,
      ),
    );

    clickSpy.mockRestore();
    (globalThis as { Blob: typeof Blob }).Blob = RealBlob;
  });

  test("opening a malformed .lsys surfaces an error message", async () => {
    render(<App />);
    const input = screen.getByTestId("lsys-file-input") as HTMLInputElement;
    const file = new File(["<not-an-lsystem/>"], "broken.lsys", {
      type: "application/xml",
    });
    (file as unknown as { text: () => Promise<string> }).text = () =>
      Promise.resolve("<not-an-lsystem/>");
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/Couldn't open file/),
    );
  });

  test("stats HUD is visible by default and toggles off via the checkbox", () => {
    render(<App />);
    expect(screen.getByTestId("stats-hud")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Show stats/i));
    expect(screen.queryByTestId("stats-hud")).not.toBeInTheDocument();
  });

  test("restores state from localStorage on mount", () => {
    const dragon = PRESETS.find((p) => p.name === "Dragon curve")!;
    const xml = `<?xml version="1.0"?><lsystem><name>Saved</name><rules><axiom>${dragon.axiom}</axiom><commands>${dragon.rules.map((r) => `${r.axiom}:${r.rule}`).join("\n")}</commands></rules><params><angle>${dragon.angle}</angle><iterations>${dragon.iterations}</iterations></params></lsystem>`;
    localStorage.setItem("elise:state:v1", xml);
    render(<App />);
    expect((screen.getByLabelText(/^Axiom$/i) as HTMLInputElement).value).toBe(
      dragon.axiom,
    );
    const selectEl = screen.getByLabelText(/^Preset$/i) as HTMLSelectElement;
    expect(selectEl.value).toBe("Saved");
    expect(selectEl.options[selectEl.selectedIndex]!.textContent).toMatch(
      /Saved \(custom\)/,
    );
  });

  test("backend toggle swaps Canvas2D for WebGPU and shows an unsupported notice in jsdom", () => {
    render(<App />);
    expect(screen.getByTestId("lsystem-canvas")).toBeInTheDocument();
    const webgpu = screen.getByLabelText(/WebGPU/i) as HTMLInputElement;
    fireEvent.click(webgpu);
    expect(screen.queryByTestId("lsystem-canvas")).not.toBeInTheDocument();
    expect(screen.getByTestId("lsystem-webgpu-canvas")).toBeInTheDocument();
    // jsdom doesn't expose `navigator.gpu`, so the component must report it.
    expect(screen.getByRole("status").textContent).toMatch(/WebGPU/i);
  });
});
