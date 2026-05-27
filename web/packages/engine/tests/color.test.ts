import { describe, expect, test } from 'vitest';
import { hexToRgb, hsvToRgb, rgbToHex, rgbToHsv } from '../src/color';

describe('hsvToRgb', () => {
    test('zero saturation is greyscale', () => {
        expect(hsvToRgb({ h: 0, s: 0, v: 0 })).toEqual({ r: 0, g: 0, b: 0 });
        expect(hsvToRgb({ h: 0, s: 0, v: 1 })).toEqual({ r: 255, g: 255, b: 255 });
        expect(hsvToRgb({ h: 0.5, s: 0, v: 0.5 })).toEqual({ r: 128, g: 128, b: 128 });
    });

    test('pure red, green, blue', () => {
        expect(hsvToRgb({ h: 0, s: 1, v: 1 })).toEqual({ r: 255, g: 0, b: 0 });
        expect(hsvToRgb({ h: 1 / 3, s: 1, v: 1 })).toEqual({ r: 0, g: 255, b: 0 });
        expect(hsvToRgb({ h: 2 / 3, s: 1, v: 1 })).toEqual({ r: 0, g: 0, b: 255 });
    });
});

describe('rgbToHsv', () => {
    test('round-trip primary colors', () => {
        for (const rgb of [
            { r: 255, g: 0, b: 0 },
            { r: 0, g: 255, b: 0 },
            { r: 0, g: 0, b: 255 },
        ]) {
            const back = hsvToRgb(rgbToHsv(rgb));
            expect(back).toEqual(rgb);
        }
    });
});

describe('hex helpers', () => {
    test('rgbToHex and hexToRgb invert each other', () => {
        const rgb = { r: 18, g: 200, b: 99 };
        expect(hexToRgb(rgbToHex(rgb))).toEqual(rgb);
    });
});
