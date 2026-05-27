/**
 * GPU L-system rewriter.
 *
 * One iteration runs three compute passes:
 *   1. expand-count : per-thread lookup of "what does this token expand to?"
 *   2. scan         : exclusive prefix sum over the lengths
 *   3. expand-write : per-thread copy into the output buffer at offsets[i]
 *
 * Two `Token` buffers ping-pong between iterations. The final buffer is read
 * back via a `MAP_READ` staging buffer.
 *
 * Rule table layout:
 *   ruleEntries: array<RuleEntry> { axiom: u32, outOffset: u32, outLength: u32, _pad: u32 }
 *   ruleTokens:  flat array<Token> indexed by (outOffset .. outOffset + outLength)
 *
 * Limits: at most 32 rules; rule outputs together must fit in
 * `MAX_RULE_TOKENS` (default 4096) tokens. Both are configurable via options.
 */

import type { Rule } from '@elise/engine';
import type { ElisGpu } from './device';
import { encodeTokens, TOKEN_STRIDE } from './tokens-gpu';
import { EXPAND_COUNT_WGSL } from './shaders/expand-count.wgsl';
import { EXPAND_WRITE_WGSL } from './shaders/expand-write.wgsl';
import { SCAN_WGSL } from './shaders/scan.wgsl';

const RULE_ENTRY_BYTES = 16;
const SCAN_WORKGROUP = 256;

/** Inclusive upper bound for the total output size of a single iteration. */
const DEFAULT_MAX_OUTPUT_TOKENS = 1_048_576;

export type RewriteOptions = {
    maxRules?: number;
    maxRuleTokens?: number;
    /** Hard cap on per-iteration output length (in tokens). */
    maxOutputTokens?: number;
};

/**
 * Encode rule axioms + their rule bodies into the GPU layout.
 *
 * Returns:
 *   - `entriesBytes`: packed `RuleEntry[]` (length = rules.length, 16B stride)
 *   - `ruleTokensBytes`: flat `Token[]` (length = sum of rule output lengths)
 *
 * Each rule's RHS is fed through the same `encodeTokens` used for the axiom,
 * so parametric args like `+(30)` survive a rewrite.
 */
function buildRuleTables(rules: Rule[]): {
    entriesBytes: Uint8Array<ArrayBuffer>;
    ruleTokensBytes: Uint8Array<ArrayBuffer>;
    entryCount: number;
} {
    const entriesBuf = new ArrayBuffer(Math.max(1, rules.length) * RULE_ENTRY_BYTES);
    const entries = new Uint8Array(entriesBuf);
    const entryView = new DataView(entriesBuf);

    // Encode each rule's RHS and concatenate.
    const encoded = rules.map((r) => encodeTokens(r.rule));
    const totalTokens = encoded.reduce((acc, e) => acc + e.count, 0);
    const ruleTokens = new Uint8Array(
        new ArrayBuffer(Math.max(TOKEN_STRIDE, totalTokens * TOKEN_STRIDE)),
    );

    let cursor = 0;
    for (let i = 0; i < rules.length; i++) {
        const r = rules[i]!;
        const enc = encoded[i]!;
        const off = i * RULE_ENTRY_BYTES;
        entryView.setUint32(off + 0, r.axiom.charCodeAt(0) >>> 0, true);
        entryView.setUint32(off + 4, cursor, true);
        entryView.setUint32(off + 8, enc.count, true);
        entryView.setUint32(off + 12, 0, true);
        ruleTokens.set(enc.bytes, cursor * TOKEN_STRIDE);
        cursor += enc.count;
    }

    return { entriesBytes: entries, ruleTokensBytes: ruleTokens, entryCount: rules.length };
}

type ComputeKit = {
    countPipeline: GPUComputePipeline;
    countLayout: GPUBindGroupLayout;
    scanBlocksPipeline: GPUComputePipeline;
    scanBlockSumsPipeline: GPUComputePipeline;
    scanAddOffsetsPipeline: GPUComputePipeline;
    scanLayout: GPUBindGroupLayout;
    writePipeline: GPUComputePipeline;
    writeLayout: GPUBindGroupLayout;
};

function buildPipelines(device: GPUDevice): ComputeKit {
    const countLayout = device.createBindGroupLayout({
        label: 'elise-rw.count-bgl',
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' },
            },
            { binding: 3, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        ],
    });
    const countPipeline = device.createComputePipeline({
        label: 'elise-rw.count',
        layout: device.createPipelineLayout({ bindGroupLayouts: [countLayout] }),
        compute: {
            module: device.createShaderModule({ code: EXPAND_COUNT_WGSL }),
            entryPoint: 'main',
        },
    });

    const scanLayout = device.createBindGroupLayout({
        label: 'elise-rw.scan-bgl',
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            { binding: 1, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
            { binding: 2, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        ],
    });
    const scanModule = device.createShaderModule({ code: SCAN_WGSL });
    const scanPipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [scanLayout] });
    const scanBlocksPipeline = device.createComputePipeline({
        label: 'elise-rw.scan-blocks',
        layout: scanPipelineLayout,
        compute: { module: scanModule, entryPoint: 'scanBlocks' },
    });
    const scanBlockSumsPipeline = device.createComputePipeline({
        label: 'elise-rw.scan-block-sums',
        layout: scanPipelineLayout,
        compute: { module: scanModule, entryPoint: 'scanBlockSums' },
    });
    const scanAddOffsetsPipeline = device.createComputePipeline({
        label: 'elise-rw.scan-add',
        layout: scanPipelineLayout,
        compute: { module: scanModule, entryPoint: 'scanAddOffsets' },
    });

    const writeLayout = device.createBindGroupLayout({
        label: 'elise-rw.write-bgl',
        entries: [
            { binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' },
            },
            {
                binding: 2,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' },
            },
            {
                binding: 3,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' },
            },
            {
                binding: 4,
                visibility: GPUShaderStage.COMPUTE,
                buffer: { type: 'read-only-storage' },
            },
            { binding: 5, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'storage' } },
        ],
    });
    const writePipeline = device.createComputePipeline({
        label: 'elise-rw.write',
        layout: device.createPipelineLayout({ bindGroupLayouts: [writeLayout] }),
        compute: {
            module: device.createShaderModule({ code: EXPAND_WRITE_WGSL }),
            entryPoint: 'main',
        },
    });

    return {
        countPipeline,
        countLayout,
        scanBlocksPipeline,
        scanBlockSumsPipeline,
        scanAddOffsetsPipeline,
        scanLayout,
        writePipeline,
        writeLayout,
    };
}

function writeParams(device: GPUDevice, buffer: GPUBuffer, count: number, ruleCount: number): void {
    const arr = new Uint32Array(4);
    arr[0] = count >>> 0;
    arr[1] = ruleCount >>> 0;
    arr[2] = 0;
    arr[3] = 0;
    device.queue.writeBuffer(buffer, 0, arr.buffer);
}

/**
 * Run the GPU rewriter. Returns the final packed Token buffer as a
 * `Uint8Array` (so callers can pass it to `decodeTokens` / `tokensToString`).
 */
export async function rewriteOnGpu(
    elis: ElisGpu,
    axiom: string,
    rules: Rule[],
    iterations: number,
    options: RewriteOptions = {},
): Promise<Uint8Array> {
    const { device } = elis;
    const maxRules = options.maxRules ?? 32;
    const maxRuleTokens = options.maxRuleTokens ?? 4096;
    const maxOutputTokens = options.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;

    if (rules.length > maxRules) {
        throw new Error(`rewriteOnGpu: too many rules (${rules.length} > ${maxRules})`);
    }

    // Encode the axiom.
    let current = encodeTokens(axiom);
    if (iterations <= 0) return current.bytes;

    const { entriesBytes, ruleTokensBytes, entryCount } = buildRuleTables(rules);
    if (ruleTokensBytes.byteLength / TOKEN_STRIDE > maxRuleTokens) {
        throw new Error(
            `rewriteOnGpu: rule table too large (${ruleTokensBytes.byteLength / TOKEN_STRIDE} > ${maxRuleTokens})`,
        );
    }

    const kit = buildPipelines(device);

    // Static rule buffers.
    const ruleEntriesBuf = device.createBuffer({
        label: 'elise-rw.rule-entries',
        size: Math.max(256, entriesBytes.byteLength),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(ruleEntriesBuf, 0, entriesBytes);

    const ruleTokensBuf = device.createBuffer({
        label: 'elise-rw.rule-tokens',
        size: Math.max(256, ruleTokensBytes.byteLength),
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(ruleTokensBuf, 0, ruleTokensBytes);

    // Two ping-pong token buffers and a few scratch buffers.
    // We size them up-front based on the worst-case post-iteration length.
    // For practical L-systems this fits comfortably under maxOutputTokens.
    const tokenBufBytes = Math.max(256, maxOutputTokens * TOKEN_STRIDE);
    const tokensA = device.createBuffer({
        label: 'elise-rw.tokens-a',
        size: tokenBufBytes,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });
    const tokensB = device.createBuffer({
        label: 'elise-rw.tokens-b',
        size: tokenBufBytes,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // The lengths buffer is always sized to the current input.  We pre-allocate
    // for the max possible *input* size we'll ever pass in (= maxOutputTokens),
    // so we never have to re-create.
    const lengthsBytes = Math.max(256, maxOutputTokens * 4);
    const lengthsBuf = device.createBuffer({
        label: 'elise-rw.lengths',
        size: lengthsBytes,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // Block sums: enough room for ceil(maxOutputTokens/256) entries, padded
    // to a 256-multiple so the second scan pass works.
    const maxBlocks = Math.ceil(maxOutputTokens / SCAN_WORKGROUP);
    const blockSumsCount = Math.max(SCAN_WORKGROUP, maxBlocks);
    const blockSumsBuf = device.createBuffer({
        label: 'elise-rw.block-sums',
        size: blockSumsCount * 4,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    });

    // Uniform buffers (params).
    const countParams = device.createBuffer({
        label: 'elise-rw.count-params',
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const writeParamsBuf = device.createBuffer({
        label: 'elise-rw.write-params',
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const scanParams = device.createBuffer({
        label: 'elise-rw.scan-params',
        size: 16,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Seed tokensA with the encoded axiom.
    device.queue.writeBuffer(tokensA, 0, current.bytes);

    // Helper: read the last element of the lengths buffer + the last offset to
    // determine the total expanded length. We do this via a small staging
    // buffer that grows as needed.
    // The total length = offsets[n-1] + lengths[n-1] but lengths is overwritten
    // by scanBlocks, so we instead read the sum stored in blockSums[last] before
    // the final add — easier: just read offsets[n-1] back after the final pass
    // AND keep a pre-scan copy of the last length value.

    let inputBuf = tokensA;
    let outputBuf = tokensB;
    let inputCount = current.count;
    let finalCount = inputCount;

    for (let iter = 0; iter < iterations; iter++) {
        if (inputCount === 0) break;

        // -------- Pass 1: expand-count --------
        writeParams(device, countParams, inputCount, entryCount);

        const countBg = device.createBindGroup({
            label: 'elise-rw.count-bg',
            layout: kit.countLayout,
            entries: [
                { binding: 0, resource: { buffer: countParams } },
                { binding: 1, resource: { buffer: inputBuf } },
                { binding: 2, resource: { buffer: ruleEntriesBuf } },
                { binding: 3, resource: { buffer: lengthsBuf } },
            ],
        });

        const encoder = device.createCommandEncoder({ label: `elise-rw.iter-${iter}` });
        {
            const pass = encoder.beginComputePass();
            pass.setPipeline(kit.countPipeline);
            pass.setBindGroup(0, countBg);
            pass.dispatchWorkgroups(Math.ceil(inputCount / SCAN_WORKGROUP));
            pass.end();
        }

        // -------- Pass 2: scan --------
        // Stash the last length to recover the total after the exclusive scan.
        // We do this in JS via a copyBuffer -> staging readback.
        // To keep latency low we instead store a "total" via a separate single-
        // workgroup reduction. Simpler approach: read offsets[n-1] post-scan and
        // add lengths[n-1] *before* the scan. We copy the last length to a small
        // 4-byte buffer here so we can read it back at the end.
        const lastLenBuf = device.createBuffer({
            label: 'elise-rw.last-len',
            size: 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });
        encoder.copyBufferToBuffer(lengthsBuf, (inputCount - 1) * 4, lastLenBuf, 0, 4);

        // Scan blocks (in-place on lengthsBuf, writes block sums into blockSumsBuf).
        writeParams(device, scanParams, inputCount, 0);
        // Block count rounded UP to a multiple of 256, so the block-sums scan
        // can operate on a power-of-two-ish tile.
        const blockCount = Math.ceil(inputCount / SCAN_WORKGROUP);
        {
            const scanBg = device.createBindGroup({
                label: 'elise-rw.scan-bg-a',
                layout: kit.scanLayout,
                entries: [
                    { binding: 0, resource: { buffer: scanParams } },
                    { binding: 1, resource: { buffer: lengthsBuf } },
                    { binding: 2, resource: { buffer: blockSumsBuf } },
                ],
            });
            const pass = encoder.beginComputePass();
            pass.setPipeline(kit.scanBlocksPipeline);
            pass.setBindGroup(0, scanBg);
            pass.dispatchWorkgroups(blockCount);
            pass.end();
        }

        // Scan blockSums (single workgroup; assumes blockCount <= 256, i.e.
        // inputCount <= 65536; see TODO in scan.wgsl.ts).
        if (blockCount > SCAN_WORKGROUP) {
            // For now, fall back to a CPU scan of blockSums if we exceed the
            // single-workgroup ceiling. This handles up to ~16M tokens.
            // TODO: implement multi-level scan on GPU.
            // We need to wait for `blockCount` block sums to be ready, do a tiny
            // readback + write back. We defer to outside the encoder.
            throw new Error(
                `rewriteOnGpu: input count ${inputCount} exceeds single-level scan ceiling (${SCAN_WORKGROUP * SCAN_WORKGROUP}); not yet supported`,
            );
        }
        {
            // For scanBlockSums, bind blockSumsBuf as the data buffer at binding 1.
            // Re-using `data` binding name + a dummy slot for binding 2.
            writeParams(device, scanParams, blockCount, 0);
            const dummy = blockSumsBuf; // it's unused inside scanBlockSums but a binding is required.
            const scanBg = device.createBindGroup({
                label: 'elise-rw.scan-bg-b',
                layout: kit.scanLayout,
                entries: [
                    { binding: 0, resource: { buffer: scanParams } },
                    { binding: 1, resource: { buffer: blockSumsBuf } },
                    { binding: 2, resource: { buffer: dummy } },
                ],
            });
            const pass = encoder.beginComputePass();
            pass.setPipeline(kit.scanBlockSumsPipeline);
            pass.setBindGroup(0, scanBg);
            pass.dispatchWorkgroups(1);
            pass.end();
        }
        {
            writeParams(device, scanParams, inputCount, 0);
            const scanBg = device.createBindGroup({
                label: 'elise-rw.scan-bg-c',
                layout: kit.scanLayout,
                entries: [
                    { binding: 0, resource: { buffer: scanParams } },
                    { binding: 1, resource: { buffer: lengthsBuf } },
                    { binding: 2, resource: { buffer: blockSumsBuf } },
                ],
            });
            const pass = encoder.beginComputePass();
            pass.setPipeline(kit.scanAddOffsetsPipeline);
            pass.setBindGroup(0, scanBg);
            pass.dispatchWorkgroups(blockCount);
            pass.end();
        }

        // Copy out the last offset so we know the total output size.
        const lastOffBuf = device.createBuffer({
            label: 'elise-rw.last-off',
            size: 4,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST,
        });
        encoder.copyBufferToBuffer(lengthsBuf, (inputCount - 1) * 4, lastOffBuf, 0, 4);

        // Submit pass-1+2 so we can read back the total before dispatching pass-3
        // (we need to know how many output tokens to dispatch the writer for —
        // actually we dispatch over `inputCount` writers, so we don't strictly
        // need to. We DO need it to size the output, but the buffers are already
        // pre-sized to the worst case. So we can fold pass-3 into the same
        // command buffer, AND read back the size in a follow-up.
        //
        // To simplify, we keep the same encoder and dispatch the writer now.

        // -------- Pass 3: expand-write --------
        writeParams(device, writeParamsBuf, inputCount, entryCount);
        const writeBg = device.createBindGroup({
            label: 'elise-rw.write-bg',
            layout: kit.writeLayout,
            entries: [
                { binding: 0, resource: { buffer: writeParamsBuf } },
                { binding: 1, resource: { buffer: inputBuf } },
                { binding: 2, resource: { buffer: ruleEntriesBuf } },
                { binding: 3, resource: { buffer: ruleTokensBuf } },
                { binding: 4, resource: { buffer: lengthsBuf } },
                { binding: 5, resource: { buffer: outputBuf } },
            ],
        });
        {
            const pass = encoder.beginComputePass();
            pass.setPipeline(kit.writePipeline);
            pass.setBindGroup(0, writeBg);
            pass.dispatchWorkgroups(Math.ceil(inputCount / SCAN_WORKGROUP));
            pass.end();
        }

        // Stage the last-offset and last-length for readback.
        const sizeStaging = device.createBuffer({
            label: 'elise-rw.size-staging',
            size: 8,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
        encoder.copyBufferToBuffer(lastOffBuf, 0, sizeStaging, 0, 4);
        encoder.copyBufferToBuffer(lastLenBuf, 0, sizeStaging, 4, 4);

        device.queue.submit([encoder.finish()]);

        await sizeStaging.mapAsync(GPUMapMode.READ);
        const view = new Uint32Array(sizeStaging.getMappedRange().slice(0));
        const lastOffset = view[0]!;
        const lastLength = view[1]!;
        sizeStaging.unmap();
        sizeStaging.destroy();
        lastLenBuf.destroy();
        lastOffBuf.destroy();

        finalCount = lastOffset + lastLength;
        if (finalCount > maxOutputTokens) {
            throw new Error(
                `rewriteOnGpu: iteration ${iter} would produce ${finalCount} tokens (> ${maxOutputTokens})`,
            );
        }

        // Ping-pong.
        const tmp = inputBuf;
        inputBuf = outputBuf;
        outputBuf = tmp;
        inputCount = finalCount;
    }

    // Read back the final buffer.
    const resultStaging = device.createBuffer({
        label: 'elise-rw.result-staging',
        size: Math.max(TOKEN_STRIDE, finalCount * TOKEN_STRIDE),
        usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
    });
    const finalEncoder = device.createCommandEncoder({ label: 'elise-rw.readback' });
    if (finalCount > 0) {
        finalEncoder.copyBufferToBuffer(inputBuf, 0, resultStaging, 0, finalCount * TOKEN_STRIDE);
    }
    device.queue.submit([finalEncoder.finish()]);

    await resultStaging.mapAsync(GPUMapMode.READ);
    const finalBytes = new Uint8Array(
        resultStaging.getMappedRange().slice(0, finalCount * TOKEN_STRIDE),
    );
    resultStaging.unmap();
    resultStaging.destroy();
    tokensA.destroy();
    tokensB.destroy();
    lengthsBuf.destroy();
    blockSumsBuf.destroy();
    ruleEntriesBuf.destroy();
    ruleTokensBuf.destroy();
    countParams.destroy();
    writeParamsBuf.destroy();
    scanParams.destroy();

    return finalBytes;
}
