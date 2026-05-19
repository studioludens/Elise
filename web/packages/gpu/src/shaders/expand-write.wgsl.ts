/**
 * Pass 3 of the GPU rewriter: thread per input token writes its expansion into
 * `outTokens[offsets[i] .. offsets[i] + lengths[i]]`.
 *
 * For a rule match, copy `ruleTokens[outOffset .. outOffset + outLength]`.
 * For a non-rule token, copy the token through unchanged (identity).
 */
export const EXPAND_WRITE_WGSL = /* wgsl */ `
struct Token {
  opcode: u32,
  arg0: f32,
  arg1: f32,
  arg2: f32,
};

struct RuleEntry {
  axiom: u32,
  outOffset: u32,
  outLength: u32,
  _pad: u32,
};

struct Params {
  tokenCount: u32,
  ruleCount:  u32,
  _pad0: u32,
  _pad1: u32,
};

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read>       inTokens:    array<Token>;
@group(0) @binding(2) var<storage, read>       ruleEntries: array<RuleEntry>;
@group(0) @binding(3) var<storage, read>       ruleTokens:  array<Token>;
@group(0) @binding(4) var<storage, read>       offsets:     array<u32>;
@group(0) @binding(5) var<storage, read_write> outTokens:   array<Token>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.tokenCount) { return; }
  let tok = inTokens[i];
  let writePos = offsets[i];

  var matched: i32 = -1;
  for (var r: u32 = 0u; r < params.ruleCount; r = r + 1u) {
    if (ruleEntries[r].axiom == tok.opcode) {
      matched = i32(r);
      break;
    }
  }

  if (matched < 0) {
    outTokens[writePos] = tok;
    return;
  }

  let entry = ruleEntries[u32(matched)];
  for (var k: u32 = 0u; k < entry.outLength; k = k + 1u) {
    outTokens[writePos + k] = ruleTokens[entry.outOffset + k];
  }
}
`;
