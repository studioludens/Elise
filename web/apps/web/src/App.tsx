import { useEffect, useMemo, useRef, useState } from "react";
import {
  exportSvg,
  hsvToRgb,
  interpret,
  MaxLengthExceededError,
  parseRules,
  PRESETS,
  rewrite,
  rgbToHex,
  serializeRules,
  type DrawEvent,
  type HSV,
  type Preset,
} from "@elise/engine";
import { AxiomInput } from "./components/AxiomInput.js";
import { RuleEditor } from "./components/RuleEditor.js";
import { SliderField } from "./components/SliderField.js";
import { ColorPicker } from "./components/ColorPicker.js";
import { PresetSelector } from "./components/PresetSelector.js";
import { Toolbar } from "./components/Toolbar.js";
import { CanvasPreview } from "./components/CanvasPreview.js";
import { WebGpuPreview } from "./components/WebGpuPreview.js";

type Backend = "canvas2d" | "webgpu";

interface Params {
  axiom: string;
  rulesText: string;
  angle: number;
  iterations: number;
  ratio: number;
  initialLineLength: number;
  initialLineThickness: number;
  hsv: HSV;
}

function intToHexString(hex: number): string {
  return `#${hex.toString(16).padStart(6, "0")}`;
}

function fromPreset(p: Preset): Params {
  return {
    axiom: p.axiom,
    rulesText: serializeRules(p.rules),
    angle: p.angle,
    iterations: p.iterations,
    ratio: 0.99,
    initialLineLength: 10,
    initialLineThickness: 1,
    hsv: { h: 0, s: 0, v: 0 },
  };
}

const DEFAULT_PRESET = PRESETS[0]!;

function safeFilename(s: string): string {
  return s.replace(/[^a-z0-9-_]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "output";
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function App(): JSX.Element {
  const [presetName, setPresetName] = useState(DEFAULT_PRESET.name);
  const [params, setParams] = useState<Params>(() => fromPreset(DEFAULT_PRESET));
  const [backend, setBackend] = useState<Backend>("canvas2d");
  const [error, setError] = useState<string | null>(null);
  const lastGoodEvents = useRef<DrawEvent[]>([]);

  const rules = useMemo(() => parseRules(params.rulesText), [params.rulesText]);

  const pipeline = useMemo<{ events: DrawEvent[]; error: string | null }>(() => {
    try {
      const system = rewrite(params.axiom, rules, params.iterations);
      const evs = interpret(system, {
        angle: params.angle,
        ratio: params.ratio,
        initialLineLength: params.initialLineLength,
        initialLineThickness: params.initialLineThickness,
        initialHsv: params.hsv,
      });
      lastGoodEvents.current = evs;
      return { events: evs, error: null };
    } catch (err) {
      let msg: string;
      if (err instanceof MaxLengthExceededError) {
        msg = `L-system exceeded ${err.limit.toLocaleString()} symbols. Lower iterations.`;
      } else if (err instanceof Error) {
        msg = err.message;
      } else {
        msg = String(err);
      }
      return { events: lastGoodEvents.current, error: msg };
    }
  }, [
    params.axiom,
    rules,
    params.iterations,
    params.angle,
    params.ratio,
    params.initialLineLength,
    params.initialLineThickness,
    params.hsv,
  ]);

  const events = pipeline.events;

  useEffect(() => {
    setError(pipeline.error);
  }, [pipeline.error]);

  const applyPreset = (p: Preset) => {
    setPresetName(p.name);
    setParams(fromPreset(p));
  };

  const colorHexString = useMemo(() => {
    const rgb = hsvToRgb(params.hsv);
    return intToHexString(rgbToHex(rgb));
  }, [params.hsv]);

  const onExportSvg = () => {
    const svg = exportSvg(events, { background: "#ffffff" });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    downloadBlob(blob, `elise-${safeFilename(presetName || params.axiom)}.svg`);
  };

  const onResetPreset = () => {
    const p = PRESETS.find((p) => p.name === presetName) ?? DEFAULT_PRESET;
    applyPreset(p);
  };

  return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        height: "100vh",
        width: "100vw",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
    >
      <aside
        style={{
          padding: 16,
          borderRight: "1px solid #ddd",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "#fff",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 18 }}>Elise</h1>
        <PresetSelector value={presetName} onChange={applyPreset} />
        <AxiomInput
          value={params.axiom}
          onChange={(axiom) => setParams((p) => ({ ...p, axiom }))}
        />
        <RuleEditor
          value={params.rulesText}
          onChange={(rulesText) => setParams((p) => ({ ...p, rulesText }))}
        />
        <SliderField
          label="Angle"
          value={params.angle}
          min={0}
          max={180}
          step={0.5}
          onChange={(angle) => setParams((p) => ({ ...p, angle }))}
        />
        <SliderField
          label="Iterations"
          value={params.iterations}
          min={0}
          max={12}
          step={1}
          onChange={(iterations) => setParams((p) => ({ ...p, iterations }))}
        />
        <SliderField
          label="Ratio"
          value={params.ratio}
          min={0.1}
          max={1.5}
          step={0.01}
          onChange={(ratio) => setParams((p) => ({ ...p, ratio }))}
        />
        <SliderField
          label="Line length"
          value={params.initialLineLength}
          min={1}
          max={100}
          step={1}
          onChange={(initialLineLength) =>
            setParams((p) => ({ ...p, initialLineLength }))
          }
        />
        <SliderField
          label="Line thickness"
          value={params.initialLineThickness}
          min={0}
          max={10}
          step={0.1}
          onChange={(initialLineThickness) =>
            setParams((p) => ({ ...p, initialLineThickness }))
          }
        />
        <ColorPicker
          value={colorHexString}
          onChange={(_hex, hsv) => setParams((p) => ({ ...p, hsv }))}
        />
        <fieldset
          style={{
            display: "flex",
            gap: 8,
            border: "1px solid #ddd",
            borderRadius: 4,
            padding: "6px 8px",
            fontSize: 12,
          }}
        >
          <legend style={{ padding: "0 4px", color: "#666" }}>Renderer</legend>
          <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="radio"
              name="backend"
              value="canvas2d"
              checked={backend === "canvas2d"}
              onChange={() => setBackend("canvas2d")}
            />
            Canvas2D
          </label>
          <label style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <input
              type="radio"
              name="backend"
              value="webgpu"
              checked={backend === "webgpu"}
              onChange={() => setBackend("webgpu")}
            />
            WebGPU
          </label>
        </fieldset>
        <Toolbar onExportSvg={onExportSvg} onResetPreset={onResetPreset} />
        <div style={{ marginTop: "auto", fontSize: 11, color: "#888" }}>
          {events.length.toLocaleString()} draw events ·{" "}
          {parseRules(params.rulesText).length} rules
        </div>
      </aside>
      <section style={{ position: "relative" }}>
        {backend === "canvas2d" ? (
          <CanvasPreview events={events} errorMessage={error} />
        ) : (
          <WebGpuPreview events={events} errorMessage={error} />
        )}
      </section>
    </main>
  );
}
