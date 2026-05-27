/**
 * GPU token encoding.
 *
 * Each token is a 16-byte record:
 *   struct Token {
 *     opcode: u32,   // character code of the engine token (e.g. 'F' = 0x46)
 *     arg0:   f32,
 *     arg1:   f32,
 *     arg2:   f32,
 *   }
 *
 * NaN (bit pattern 0x7FC00000) marks "no arg". Strings carry parametric args in
 * parentheses (`F(0.5)`, `C(h,s,v)`), which we parse out into arg0/arg1/arg2.
 */

/** IEEE 754 "no arg" sentinel (quiet NaN). */
export const NO_ARG_BITS = 0x7fc0_0000 >>> 0;

/** Bytes per token in the GPU layout. */
export const TOKEN_STRIDE = 16;

/**
 * Reusable scratch buffers for bit-casting between f32 and u32. We do this so
 * we get an exact float bit pattern (NaN payload preserved) rather than the
 * arithmetic result of `0/0`.
 */
const scratch = new ArrayBuffer(4);
const scratchF32 = new Float32Array(scratch);
const scratchU32 = new Uint32Array(scratch);

export function u32ToF32Bits(bits: number): number {
    scratchU32[0] = bits >>> 0;
    return scratchF32[0]!;
}

export function f32BitsToU32(value: number): number {
    scratchF32[0] = value;
    return scratchU32[0]!;
}

/** Returns the f32 value whose bit pattern encodes "no argument". */
export function noArgValue(): number {
    return u32ToF32Bits(NO_ARG_BITS);
}

/** Returns true if a decoded arg value should be treated as "no arg". */
export function isNoArg(value: number): boolean {
    return Number.isNaN(value);
}

/** The character codes that may carry parametric args. */
const ARG_CARRIER_CODES = new Set<number>([
    'F'.charCodeAt(0),
    'G'.charCodeAt(0),
    'B'.charCodeAt(0),
    'f'.charCodeAt(0),
    'g'.charCodeAt(0),
    '+'.charCodeAt(0),
    '-'.charCodeAt(0),
    '!'.charCodeAt(0),
    '@'.charCodeAt(0),
    'V'.charCodeAt(0),
    'C'.charCodeAt(0),
    'S'.charCodeAt(0),
]);

/**
 * Parse an arg list of the form "(a,b,c)" starting at `pos` (where `pos`
 * points at the '('). Returns the parsed numbers and the index of ')'.
 */
function parseArgList(s: string, pos: number): { args: number[]; end: number } | null {
    if (s[pos] !== '(') return null;
    const args: number[] = [];
    let current = '';
    for (let j = pos + 1; j < s.length; j++) {
        const ch = s[j]!;
        if (ch === ')') {
            if (current.length > 0) args.push(Number(current));
            return { args, end: j };
        }
        if (ch === ',') {
            args.push(Number(current));
            current = '';
        } else {
            current += ch;
        }
    }
    // Unterminated; treat as EOF.
    if (current.length > 0) args.push(Number(current));
    return { args, end: s.length - 1 };
}

export type EncodedTokens = {
    /**
     * Raw little-endian byte buffer, length = count * TOKEN_STRIDE.
     *
     * Typed as `Uint8Array<ArrayBuffer>` so it satisfies the strict
     * `GPUAllowSharedBufferSource` shape that WebGPU's type defs require for
     * `queue.writeBuffer`. The runtime value is just a Uint8Array.
     */
    bytes: Uint8Array<ArrayBuffer>;
    /** Number of tokens. */
    count: number;
};

/**
 * Encode an L-system string (with optional parenthesised parametric args) into
 * the packed GPU layout.
 *
 * Unrecognised characters are emitted as a token with their literal char code
 * and no args. This is harmless: the GPU rewriter and interpreter will simply
 * pass them through.
 */
export function encodeTokens(input: string): EncodedTokens {
    // Two-pass: first count tokens so we can allocate exactly.
    let count = 0;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i]!;
        if (ch === '(') {
            // Args belong to the previous token; skip the whole list.
            const parsed = parseArgList(input, i);
            if (parsed) i = parsed.end;
            continue;
        }
        count++;
    }

    // Allocate via ArrayBuffer (not `new Uint8Array(n)`) so the resulting
    // typed-array carries `Uint8Array<ArrayBuffer>` rather than the looser
    // `ArrayBufferLike` generic. The WebGPU type defs require the strict form.
    const buffer = new ArrayBuffer(count * TOKEN_STRIDE);
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const noArg = u32ToF32Bits(NO_ARG_BITS);

    let writeIdx = 0;
    for (let i = 0; i < input.length; i++) {
        const ch = input[i]!;
        const code = ch.charCodeAt(0);
        let arg0 = noArg;
        let arg1 = noArg;
        let arg2 = noArg;

        // Look ahead for an arg list.
        if (i + 1 < input.length && input[i + 1] === '(' && ARG_CARRIER_CODES.has(code)) {
            const parsed = parseArgList(input, i + 1);
            if (parsed) {
                if (parsed.args.length >= 1) arg0 = parsed.args[0]!;
                if (parsed.args.length >= 2) arg1 = parsed.args[1]!;
                if (parsed.args.length >= 3) arg2 = parsed.args[2]!;
                i = parsed.end;
            }
        }

        const off = writeIdx * TOKEN_STRIDE;
        view.setUint32(off + 0, code >>> 0, true);
        view.setFloat32(off + 4, arg0, true);
        view.setFloat32(off + 8, arg1, true);
        view.setFloat32(off + 12, arg2, true);
        writeIdx++;
    }

    return { bytes, count };
}

export type DecodedToken = {
    opcode: number;
    char: string;
    arg0: number;
    arg1: number;
    arg2: number;
};

/**
 * Decode a packed token buffer back into the structured form. Useful for
 * verification & debugging.
 */
export function decodeTokens(bytes: Uint8Array, count?: number): DecodedToken[] {
    const n = count ?? Math.floor(bytes.byteLength / TOKEN_STRIDE);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const out: DecodedToken[] = new Array(n);
    for (let i = 0; i < n; i++) {
        const off = i * TOKEN_STRIDE;
        const opcode = view.getUint32(off + 0, true);
        const arg0 = view.getFloat32(off + 4, true);
        const arg1 = view.getFloat32(off + 8, true);
        const arg2 = view.getFloat32(off + 12, true);
        out[i] = {
            opcode,
            char: String.fromCharCode(opcode),
            arg0,
            arg1,
            arg2,
        };
    }
    return out;
}

/**
 * Render the packed tokens back to a human-readable string. NaN args become
 * "no arg" (i.e. the parenthesised list is omitted entirely). This is useful
 * for round-trip testing against the CPU rewriter/interpreter, which still
 * operates on strings.
 */
export function tokensToString(bytes: Uint8Array, count?: number): string {
    const tokens = decodeTokens(bytes, count);
    let out = '';
    for (const t of tokens) {
        out += t.char;
        const args: number[] = [];
        if (!isNoArg(t.arg0)) args.push(t.arg0);
        if (!isNoArg(t.arg1)) args.push(t.arg1);
        if (!isNoArg(t.arg2)) args.push(t.arg2);
        if (args.length > 0) {
            out += '(' + args.join(',') + ')';
        }
    }
    return out;
}
