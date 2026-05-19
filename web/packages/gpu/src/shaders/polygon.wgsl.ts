/**
 * Basic flat-shaded triangle pipeline for polygon fills.
 *
 * Vertex format (3 floats / 12 bytes per vertex):
 *   x, y, colorBits (u32 bit-cast to f32)
 *
 * Triangles are emitted as three sequential vertices; the renderer can use a
 * draw call of `count = vertexCount`.
 */
export const POLYGON_WGSL = /* wgsl */ `
struct Camera {
  viewProj: mat4x4<f32>,
  viewport: vec2<f32>,
  _pad: vec2<f32>,
};

@group(0) @binding(0) var<uniform> camera: Camera;

struct VsIn {
  @location(0) pos: vec2<f32>,
  @location(1) colorBits: f32,
};

struct VsOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) color: vec4<f32>,
};

fn unpackColor(bits: f32) -> vec4<f32> {
  let u = bitcast<u32>(bits);
  let r = f32((u >> 24u) & 0xffu) / 255.0;
  let g = f32((u >> 16u) & 0xffu) / 255.0;
  let b = f32((u >>  8u) & 0xffu) / 255.0;
  let a = f32( u        & 0xffu) / 255.0;
  return vec4<f32>(r, g, b, a);
}

@vertex
fn vs_main(in: VsIn) -> VsOut {
  var out: VsOut;
  out.pos = camera.viewProj * vec4<f32>(in.pos, 0.0, 1.0);
  out.color = unpackColor(in.colorBits);
  return out;
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
  return in.color;
}
`;
