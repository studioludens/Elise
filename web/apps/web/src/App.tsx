import { useEffect, useMemo, useRef, useState } from "react";
import {
  exportSvg,
  hsvToRgb,
  interpret,
  InvalidLsysError,
  MaxLengthExceededError,
  parseLsys,
  parseRules,
  PRESETS,
  rewrite,
  rgbToHex,
  serializeLsys,
  serializeRules,
  type DrawEvent,
  type HSV,
  type LsysFile,
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
import { StatsHud } from "./components/StatsHud.js";
import { loadState } from "./storage.js";
import { useAutosave } from "./useAutosave.js";
import { useShortcuts } from "./useShortcuts.js";

type Backend = "canvas2d" | "webgpu";

type Params = {
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

function paramsFromLsys(file: LsysFile): Params {
  return {
    axiom: file.axiom,
    rulesText: serializeRules(file.rules),
    angle: file.params.angle,
    iterations: file.params.iterations,
    ratio: file.params.ratio,
    initialLineLength: file.params.initialLineLength,
    initialLineThickness: file.params.initialLineThickness,
    hsv: file.params.hsv,
  };
}

const DEFAULT_PRESET = PRESETS[0]!;

type InitialState = { presetName: string; params: Params };

function initialState(): InitialState {
  const restored = loadState();
  if (restored) {
    return {
      presetName: restored.name ?? "Restored",
      params: paramsFromLsys(restored),
    };
  }
  return { presetName: DEFAULT_PRESET.name, params: fromPreset(DEFAULT_PRESET) };
}

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
  const initial = useMemo(initialState, []);
  const [presetName, setPresetName] = useState(initial.presetName);
  const [params, setParams] = useState<Params>(initial.params);
  const [backend, setBackend] = useState<Backend>("canvas2d");
  const [error, setError] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(true);
  const lastGoodEvents = useRef<DrawEvent[]>([]);
  const lastGoodSystemLength = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rules = useMemo(() => parseRules(params.rulesText), [params.rulesText]);

  const pipeline = useMemo<{
    events: DrawEvent[];
    systemLength: number;
    rewriteMs: number;
    interpretMs: number;
    error: string | null;
  }>(() => {
    try {
      const t0 = performance.now();
      const system = rewrite(params.axiom, rules, params.iterations);
      const t1 = performance.now();
      const evs = interpret(system, {
        angle: params.angle,
        ratio: params.ratio,
        initialLineLength: params.initialLineLength,
        initialLineThickness: params.initialLineThickness,
        initialHsv: params.hsv,
      });
      const t2 = performance.now();
      lastGoodEvents.current = evs;
      lastGoodSystemLength.current = system.length;
      return {
        events: evs,
        systemLength: system.length,
        rewriteMs: t1 - t0,
        interpretMs: t2 - t1,
        error: null,
      };
    } catch (err) {
      let msg: string;
      if (err instanceof MaxLengthExceededError) {
        msg = `L-system exceeded ${err.limit.toLocaleString()} symbols. Lower iterations.`;
      } else if (err instanceof Error) {
        msg = err.message;
      } else {
        msg = String(err);
      }
      return {
        events: lastGoodEvents.current,
        systemLength: lastGoodSystemLength.current,
        rewriteMs: 0,
        interpretMs: 0,
        error: msg,
      };
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

  const currentAsLsys = (): LsysFile => ({
    name: presetName,
    axiom: params.axiom,
    rules,
    params: {
      angle: params.angle,
      iterations: params.iterations,
      ratio: params.ratio,
      initialLineLength: params.initialLineLength,
      initialLineThickness: params.initialLineThickness,
      hsv: params.hsv,
    },
  });

  const onSaveLsys = () => {
    const xml = serializeLsys(currentAsLsys());
    const blob = new Blob([xml], { type: "application/xml" });
    downloadBlob(blob, `${safeFilename(presetName || params.axiom)}.lsys`);
  };

  const onOpenLsys = (text: string, filename: string) => {
    try {
      const file = parseLsys(text);
      const stem = filename.replace(/\.[^.]+$/, "");
      const displayName = file.name ?? stem;
      setPresetName(displayName);
      setParams(paramsFromLsys(file));
      setError(null);
    } catch (err) {
      const msg =
        err instanceof InvalidLsysError
          ? `Couldn't open file: ${err.message}`
          : err instanceof Error
            ? err.message
            : String(err);
      setError(msg);
    }
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    onOpenLsys(text, file.name);
    e.target.value = "";
  };

  const triggerOpenDialog = () => fileInputRef.current?.click();

  useAutosave(currentAsLsys());
  useShortcuts({
    onSave: onSaveLsys,
    onOpen: triggerOpenDialog,
    onReset: onResetPreset,
    onExport: onExportSvg,
  });

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
        <Toolbar
          onExportSvg={onExportSvg}
          onSaveLsys={onSaveLsys}
          onOpenLsys={triggerOpenDialog}
          onResetPreset={onResetPreset}
        />
        <label
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            fontSize: 12,
            color: "#666",
          }}
        >
          <input
            type="checkbox"
            checked={showStats}
            onChange={(e) => setShowStats(e.target.checked)}
          />
          Show stats
        </label>
        <div style={{ marginTop: "auto", fontSize: 11, color: "#888" }}>
          {events.length.toLocaleString()} draw events ·{" "}
          {parseRules(params.rulesText).length} rules
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".lsys,.xml,application/xml,text/xml"
          style={{ display: "none" }}
          onChange={onPickFile}
          data-testid="lsys-file-input"
        />
      </aside>
      <section style={{ position: "relative" }}>
        {backend === "canvas2d" ? (
          <CanvasPreview events={events} errorMessage={error} />
        ) : (
          <WebGpuPreview events={events} errorMessage={error} />
        )}
        {showStats && (
          <StatsHud
            events={events}
            systemLength={pipeline.systemLength}
            rewriteMs={pipeline.rewriteMs}
            interpretMs={pipeline.interpretMs}
          />
        )}
      </section>
    </main>
  );
}
