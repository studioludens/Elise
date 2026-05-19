/**
 * GPU interpreter — "Option B" (pragmatic) version.
 *
 * The CPU walks the token stream once, computing for each draw-emitting token
 * (`F`, `G`, `B`, `~`, `\``) the *starting* turtle state and the resolved
 * length/angle/thickness/color. It writes a packed `DrawRecord` buffer of 32
 * bytes each:
 *
 *   struct DrawRecord {
 *     kind:       u32, // 0 = line forward, 1 = line backward, 2 = (reserved)
 *     x0:         f32,
 *     y0:         f32,
 *     angle:      f32, // degrees, same convention as the engine turtle
 *     lineLength: f32,
 *     color:      u32, // 0xRRGGBBAA
 *     thickness:  f32,
 *     arg:        f32, // optional per-token length multiplier (NaN → 1.0)
 *   }
 *
 * This compute kernel reads one record per thread, computes the endpoint, and
 * writes a `Segment` (the same 6-float layout `LineRenderer` consumes).
 *
 * The CPU pre-pass is unavoidable for now because bracket `[ ]` push/pop +
 * style mutations are inherently serial: each token may depend on the entire
 * prefix history of the stream. We avoid the cost of CPU geometry generation —
 * only the *state* is computed serially; the endpoint math, color packing, and
 * buffer layout are fully parallel.
 *
 * TODO (Option A — full GPU interpretation):
 *   1. Encode the token stream with per-token "depth deltas" (+1 for `[`,
 *      -1 for `]`, 0 otherwise).
 *   2. Run an exclusive prefix sum over the depth deltas to get the stack
 *      depth at every token.
 *   3. For each draw token, compute its enclosing bracket frame by a segmented
 *      scan keyed on stack depth: within each contiguous range of equal depth,
 *      the leading `[` (or stream start) determines the initial turtle state.
 *   4. Use a second segmented scan within each frame to accumulate the local
 *      angle / length / color transformations applied by `+ - ! @ V c S s`.
 *   5. Combine "parent frame snapshot" + "local accumulated transform" to
 *      derive each draw token's starting state in O(log n) parallel passes.
 *
 * This is doable but involved (~3 segmented-scan passes); revisit once the
 * pipeline ships and we have a real-world bottleneck to point at.
 */
export const INTERPRET_WGSL = /* wgsl */ `
struct DrawRecord {
  kind:       u32,
  x0:         f32,
  y0:         f32,
  angle:      f32,
  lineLength: f32,
  color:      u32,
  thickness:  f32,
  arg:        f32,
};

struct Segment {
  x0: f32,
  y0: f32,
  x1: f32,
  y1: f32,
  colorBits: f32,
  thickness: f32,
};

struct Params {
  count: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read>       records:  array<DrawRecord>;
@group(0) @binding(2) var<storage, read_write> segments: array<Segment>;

const TO_RADIANS: f32 = 0.0174532925199433;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.count) { return; }
  let r = records[i];

  // arg defaults to 1.0 when "no arg" (NaN).
  var mul: f32 = r.arg;
  if (mul != mul) { mul = 1.0; }

  let theta = r.angle * TO_RADIANS;
  // Engine convention: dx = sin(theta), dy = -cos(theta).
  let dx = sin(theta);
  let dy = -cos(theta);
  let dist = r.lineLength * mul;
  // kind 0 = forward, 1 = backward.
  let sign = select(1.0, -1.0, r.kind == 1u);

  let x1 = r.x0 + sign * dx * dist;
  let y1 = r.y0 + sign * dy * dist;

  var seg: Segment;
  seg.x0 = r.x0;
  seg.y0 = r.y0;
  seg.x1 = x1;
  seg.y1 = y1;
  seg.colorBits = bitcast<f32>(r.color);
  seg.thickness = r.thickness;
  segments[i] = seg;
}
`;
