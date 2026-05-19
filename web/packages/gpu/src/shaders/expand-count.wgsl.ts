/**
 * Pass 1 of the GPU rewriter: for each input token, write its expansion length
 * into `lengths[i]`.
 *
 * Layout:
 *   inTokens     : array<Token>  — packed input
 *   ruleEntries  : array<RuleEntry> — one per active rule (axiom char, offset, len)
 *   ruleCount    : push-constant-ish via the uniforms (params.ruleCount)
 *   lengths      : array<u32>    — output, same length as inTokens
 */
export const EXPAND_COUNT_WGSL = /* wgsl */ `
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
@group(0) @binding(3) var<storage, read_write> lengths:     array<u32>;

@compute @workgroup_size(256)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= params.tokenCount) { return; }
  let tok = inTokens[i];
  var len: u32 = 1u;
  for (var r: u32 = 0u; r < params.ruleCount; r = r + 1u) {
    if (ruleEntries[r].axiom == tok.opcode) {
      len = ruleEntries[r].outLength;
      break;
    }
  }
  lengths[i] = len;
}
`;
