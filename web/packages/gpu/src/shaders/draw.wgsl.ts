/**
 * WGSL for the instanced-quad thick-line pass.
 *
 * Per-instance data lives in a storage buffer of `Segment` records:
 *   x0, y0, x1, y1, colorBits (u32 bit-cast to f32), thickness
 *
 * The vertex shader expands each instance into a 6-vertex (two-triangle) quad
 * oriented perpendicular to the segment direction, with width = `thickness`.
 * Square caps (extend by `0.5 * thickness` along the segment direction) keep
 * short segments visible; we leave round/bevel joins for later.
 *
 * The fragment shader does a tiny AA edge using `fwidth`, then outputs the
 * solid per-instance color with the AA fade in alpha.
 */
export const DRAW_WGSL = /* wgsl */ `
struct Segment {
  x0: f32,
  y0: f32,
  x1: f32,
  y1: f32,
  colorBits: f32,
  thickness: f32,
};

struct Camera {
  // Combined projection * view, column-major as WGSL expects.
  viewProj: mat4x4<f32>,
  // x, y: viewport size in pixels (used to scale AA radius if needed).
  viewport: vec2<f32>,
  // World-units-per-CSS-pixel scale (i.e. view.scale). Used to convert
  // CSS-pixel line thickness into the world-space offset the projection
  // expects, so thickness stays constant on-screen regardless of zoom or
  // auto-fit (matching the canvas2d renderer's behavior).
  scale: f32,
  _pad: f32,
};

@group(0) @binding(0) var<uniform> camera: Camera;
@group(0) @binding(1) var<storage, read> segments: array<Segment>;

struct VsOut {
  @builtin(position) pos: vec4<f32>,
  @location(0) color: vec4<f32>,
  // Signed distance from quad centreline, normalized to [-1, 1] across width.
  @location(1) edgeT: f32,
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
fn vs_main(
  @builtin(vertex_index)   vid: u32,
  @builtin(instance_index) iid: u32,
) -> VsOut {
  let seg = segments[iid];
  let p0  = vec2<f32>(seg.x0, seg.y0);
  let p1  = vec2<f32>(seg.x1, seg.y1);
  let dir = p1 - p0;
  let len = max(length(dir), 1e-6);
  let t   = dir / len;
  let n   = vec2<f32>(-t.y, t.x);

  // thickness is in CSS pixels; divide by world-to-pixel scale so the offset
  // is in world units that the projection will scale back to the intended
  // pixel width.
  let invScale = 1.0 / max(camera.scale, 1e-12);
  let halfW = max(seg.thickness * 0.5, 0.5) * invScale;
  let cap   = halfW;

  // 6 vertices = 2 triangles forming a quad.
  // index : 0     1     2     3     4     5
  // local : -t,+n -t,-n +t,+n +t,+n -t,-n +t,-n
  var quadDir: f32;
  var quadNor: f32;
  switch (vid) {
    case 0u: { quadDir = -1.0; quadNor =  1.0; }
    case 1u: { quadDir = -1.0; quadNor = -1.0; }
    case 2u: { quadDir =  1.0; quadNor =  1.0; }
    case 3u: { quadDir =  1.0; quadNor =  1.0; }
    case 4u: { quadDir = -1.0; quadNor = -1.0; }
    default: { quadDir =  1.0; quadNor = -1.0; }
  }

  let base = select(p0, p1, quadDir > 0.0);
  let offset = t * (quadDir * cap) + n * (quadNor * halfW);
  let world = base + offset;

  var out: VsOut;
  out.pos = camera.viewProj * vec4<f32>(world, 0.0, 1.0);
  out.color = unpackColor(seg.colorBits);
  out.edgeT = quadNor;
  return out;
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
  // edgeT is in [-1, 1] across the segment width. fwidth gives us the screen
  // derivative — 1px transition into the AA edge.
  let d = 1.0 - abs(in.edgeT);
  let aa = smoothstep(0.0, fwidth(in.edgeT) + 1e-5, d);
  return vec4<f32>(in.color.rgb, in.color.a * aa);
}
`;
