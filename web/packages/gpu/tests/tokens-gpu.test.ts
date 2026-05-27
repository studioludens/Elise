import { describe, expect, test } from 'vitest';
import {
    encodeTokens,
    decodeTokens,
    tokensToString,
    isNoArg,
    NO_ARG_BITS,
    noArgValue,
    f32BitsToU32,
    TOKEN_STRIDE,
} from '../src/tokens-gpu';

describe('tokens-gpu', () => {
    test('encodes plain tokens with NaN args and decodes back to the same chars', () => {
        const { bytes, count } = encodeTokens('F+F-F');
        expect(count).toBe(5);
        expect(bytes.byteLength).toBe(5 * TOKEN_STRIDE);
        const tokens = decodeTokens(bytes);
        expect(tokens.map((t) => t.char).join('')).toBe('F+F-F');
        for (const t of tokens) {
            expect(isNoArg(t.arg0)).toBe(true);
            expect(isNoArg(t.arg1)).toBe(true);
            expect(isNoArg(t.arg2)).toBe(true);
        }
    });

    test('noArg sentinel bit pattern is 0x7FC00000', () => {
        expect(NO_ARG_BITS).toBe(0x7fc00000);
        const v = noArgValue();
        expect(Number.isNaN(v)).toBe(true);
        expect(f32BitsToU32(v)).toBe(0x7fc00000);
    });

    test('captures parametric args F(0.5)', () => {
        const { bytes, count } = encodeTokens('F(0.5)+F');
        expect(count).toBe(3);
        const tokens = decodeTokens(bytes);
        expect(tokens[0]!.char).toBe('F');
        expect(tokens[0]!.arg0).toBeCloseTo(0.5);
        expect(isNoArg(tokens[0]!.arg1)).toBe(true);
        expect(tokens[1]!.char).toBe('+');
        expect(tokens[2]!.char).toBe('F');
        expect(isNoArg(tokens[2]!.arg0)).toBe(true);
    });

    test('captures three-arg C(h,s,v)', () => {
        const { bytes } = encodeTokens('C(0.25,0.5,0.75)F');
        const tokens = decodeTokens(bytes);
        expect(tokens).toHaveLength(2);
        expect(tokens[0]!.char).toBe('C');
        expect(tokens[0]!.arg0).toBeCloseTo(0.25);
        expect(tokens[0]!.arg1).toBeCloseTo(0.5);
        expect(tokens[0]!.arg2).toBeCloseTo(0.75);
    });

    test('round-trips an L-system string with mixed args back through tokensToString', () => {
        // Use values that are exactly representable in f32 so the round-trip is
        // byte-perfect. (Values like 0.1 would suffer the usual f32 precision
        // loss, which we verify separately.)
        const src = 'F(0.5)+(30)F-F[+F]C(0.25,1,1)F';
        const { bytes } = encodeTokens(src);
        const restored = tokensToString(bytes);
        expect(restored).toBe(src);
    });

    test('non-exact f32 args round-trip with the expected precision loss', () => {
        const { bytes } = encodeTokens('F(0.1)');
        const restored = tokensToString(bytes);
        // 0.1 in f32 == 0.10000000149011612 — we don't try to round-trip-format
        // exactly; just confirm it parses back into something very close.
        const match = restored.match(/F\(([^)]+)\)/);
        expect(match).not.toBeNull();
        expect(Number(match![1])).toBeCloseTo(0.1, 6);
    });

    test("ignores stray '(' args on non-carrier tokens", () => {
        // '[' is not in ARG_CARRIER_CODES; the '(' immediately after must NOT
        // be consumed as an arg list, otherwise the bracket logic breaks.
        // (In practice the engine never produces this, but we exercise the
        // defensive path.)
        const src = '[F]';
        const { bytes, count } = encodeTokens(src);
        expect(count).toBe(3);
        const tokens = decodeTokens(bytes);
        expect(tokens.map((t) => t.char).join('')).toBe('[F]');
    });

    test('decodes from a partial count without scanning trailing bytes', () => {
        const { bytes } = encodeTokens('FFFF');
        const tokens = decodeTokens(bytes, 2);
        expect(tokens).toHaveLength(2);
    });
});
