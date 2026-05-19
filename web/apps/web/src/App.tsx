import { useEffect, useState } from "react";
import { ENGINE_VERSION } from "@elise/engine";
import { requestAdapter } from "@elise/gpu";

type WebGPUStatus = "checking" | "available" | "unavailable";

export function App() {
  const [status, setStatus] = useState<WebGPUStatus>("checking");

  useEffect(() => {
    requestAdapter()
      .then((adapter) => setStatus(adapter ? "available" : "unavailable"))
      .catch(() => setStatus("unavailable"));
  }, []);

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
      <h1>Elise</h1>
      <p>L-system explorer. Engine v{ENGINE_VERSION}.</p>
      <p>WebGPU: {status}</p>
    </main>
  );
}
