/**
 * Blelloch-style exclusive prefix sum (256-wide workgroups).
 *
 * Pass A (`scanBlocks`):
 *   - Each workgroup reads 256 values, performs an in-place up-sweep +
 *     down-sweep in workgroup shared memory, then writes:
 *       * the exclusive scan back to `data[i]`
 *       * the workgroup's total sum to `blockSums[wgid]`
 *
 * Pass B (`scanBlockSums`):
 *   - One workgroup scans `blockSums` (assumes ≤ 256 blocks; for larger inputs,
 *     this would chain into a third pass, which we leave as a TODO since
 *     250k input tokens / 256 = ~1000 blocks would already exceed this limit).
 *     For now we assume the caller dispatches a multi-level scan iff needed
 *     (the JS-side wrapper picks workgroup count accordingly).
 *
 * Pass C (`scanAddOffsets`):
 *   - Adds `blockSums[wgid]` to every element of `data` within workgroup
 *     `wgid`, producing the final exclusive scan.
 *
 * For input sizes ≤ 65536 (256 * 256) two levels are enough; that covers any
 * single rewrite iteration we expect in practice (`maxLength` = 250_000 in the
 * engine — see TODO).
 *
 * TODO: extend to a third level for buffers > 65k. The cleanest fix is to run
 * `scanBlockSums` recursively on the level-1 block sums.
 */
export const SCAN_WGSL = /* wgsl */ `
struct Params {
  count: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read_write> data:      array<u32>;
@group(0) @binding(2) var<storage, read_write> blockSums: array<u32>;

const BLOCK: u32 = 256u;

var<workgroup> tile: array<u32, 256u>;

fn loadTile(i: u32) -> u32 {
  if (i < params.count) { return data[i]; }
  return 0u;
}

@compute @workgroup_size(256)
fn scanBlocks(
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(local_invocation_id)  lid: vec3<u32>,
  @builtin(workgroup_id)         wid: vec3<u32>,
) {
  let li = lid.x;
  let gi = gid.x;

  tile[li] = loadTile(gi);
  workgroupBarrier();

  // Up-sweep (reduce).
  var offset: u32 = 1u;
  var d: u32 = BLOCK >> 1u;
  loop {
    if (d == 0u) { break; }
    if (li < d) {
      let ai = offset * (2u * li + 1u) - 1u;
      let bi = offset * (2u * li + 2u) - 1u;
      tile[bi] = tile[bi] + tile[ai];
    }
    offset = offset << 1u;
    d = d >> 1u;
    workgroupBarrier();
  }

  // Stash the block sum, clear the root for the down-sweep.
  if (li == 0u) {
    blockSums[wid.x] = tile[BLOCK - 1u];
    tile[BLOCK - 1u] = 0u;
  }
  workgroupBarrier();

  // Down-sweep.
  d = 1u;
  loop {
    if (d >= BLOCK) { break; }
    offset = offset >> 1u;
    if (li < d) {
      let ai = offset * (2u * li + 1u) - 1u;
      let bi = offset * (2u * li + 2u) - 1u;
      let tmp = tile[ai];
      tile[ai] = tile[bi];
      tile[bi] = tile[bi] + tmp;
    }
    d = d << 1u;
    workgroupBarrier();
  }

  if (gi < params.count) {
    data[gi] = tile[li];
  }
}

// One-workgroup scan over the blockSums array. Same algorithm, no per-block
// accumulator. Caller is responsible for ensuring count <= 256.
var<workgroup> tile2: array<u32, 256u>;

@compute @workgroup_size(256)
fn scanBlockSums(
  @builtin(local_invocation_id) lid: vec3<u32>,
) {
  let li = lid.x;
  // blockSums is the same binding as data in this pipeline variant: the
  // caller binds the blockSums buffer at binding 1, and a dummy buffer at
  // binding 2. params.count = number of blocks.
  if (li < params.count) { tile2[li] = data[li]; } else { tile2[li] = 0u; }
  workgroupBarrier();

  var offset: u32 = 1u;
  var d: u32 = BLOCK >> 1u;
  loop {
    if (d == 0u) { break; }
    if (li < d) {
      let ai = offset * (2u * li + 1u) - 1u;
      let bi = offset * (2u * li + 2u) - 1u;
      tile2[bi] = tile2[bi] + tile2[ai];
    }
    offset = offset << 1u;
    d = d >> 1u;
    workgroupBarrier();
  }

  if (li == 0u) { tile2[BLOCK - 1u] = 0u; }
  workgroupBarrier();

  d = 1u;
  loop {
    if (d >= BLOCK) { break; }
    offset = offset >> 1u;
    if (li < d) {
      let ai = offset * (2u * li + 1u) - 1u;
      let bi = offset * (2u * li + 2u) - 1u;
      let tmp = tile2[ai];
      tile2[ai] = tile2[bi];
      tile2[bi] = tile2[bi] + tmp;
    }
    d = d << 1u;
    workgroupBarrier();
  }

  if (li < params.count) {
    data[li] = tile2[li];
  }
}

@compute @workgroup_size(256)
fn scanAddOffsets(
  @builtin(global_invocation_id) gid: vec3<u32>,
  @builtin(workgroup_id)         wid: vec3<u32>,
) {
  let i = gid.x;
  if (i >= params.count) { return; }
  // blockSums[wid.x] holds the (already scanned) prefix sum offset for this
  // workgroup. Adding it to every per-block exclusive scan yields the global
  // exclusive scan.
  data[i] = data[i] + blockSums[wid.x];
}
`;
