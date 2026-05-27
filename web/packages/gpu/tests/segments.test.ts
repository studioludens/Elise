import { describe, expect, test } from 'vitest';
import type { DrawEvent } from '@elise/engine';
import {
    eventsToSegments,
    packColorRgba,
    SEGMENT_FLOATS,
    POLY_VERTEX_FLOATS,
} from '../src/segments';

describe('eventsToSegments', () => {
    test('packs a single line into 6 floats with the documented layout', () => {
        const events: DrawEvent[] = [
            { kind: 'line', x0: 0, y0: 0, x1: 10, y1: 20, color: 0xff0000, thickness: 2 },
        ];
        const { lines, polygons } = eventsToSegments(events);
        expect(lines.length).toBe(SEGMENT_FLOATS);
        expect(polygons.length).toBe(0);
        expect(lines[0]).toBe(0);
        expect(lines[1]).toBe(0);
        expect(lines[2]).toBe(10);
        expect(lines[3]).toBe(20);
        // Color: 0xFF0000 -> 0xFF0000FF
        const expectedColor = packColorRgba(0xff0000);
        expect(lines[4]).toBe(expectedColor);
        expect(lines[5]).toBe(2);
    });

    test('ignores move/style events for line geometry', () => {
        const events: DrawEvent[] = [
            { kind: 'style', color: 0x123456, thickness: 1 },
            { kind: 'move', x: 5, y: 5 },
            { kind: 'line', x0: 0, y0: 0, x1: 1, y1: 1, color: 0x123456, thickness: 1 },
        ];
        const { lines } = eventsToSegments(events);
        expect(lines.length).toBe(SEGMENT_FLOATS);
    });

    test('tessellates a triangle polygon into one fill triangle + 3 outline edges', () => {
        const events: DrawEvent[] = [
            { kind: 'poly-start', x: 0, y: 0, color: 0x00ff00 },
            { kind: 'poly-point', x: 10, y: 0 },
            { kind: 'poly-point', x: 5, y: 10 },
            { kind: 'poly-end' },
        ];
        const { lines, polygons } = eventsToSegments(events);
        // 1 fill triangle = 3 vertices * 3 floats each.
        expect(polygons.length).toBe(3 * POLY_VERTEX_FLOATS);
        // 3 outline edges = 3 * 6 floats.
        expect(lines.length).toBe(3 * SEGMENT_FLOATS);
    });

    test('tessellates a quad polygon as 2 fan triangles', () => {
        const events: DrawEvent[] = [
            { kind: 'poly-start', x: 0, y: 0, color: 0x0000ff },
            { kind: 'poly-point', x: 10, y: 0 },
            { kind: 'poly-point', x: 10, y: 10 },
            { kind: 'poly-point', x: 0, y: 10 },
            { kind: 'poly-end' },
        ];
        const { polygons } = eventsToSegments(events);
        expect(polygons.length).toBe(2 * 3 * POLY_VERTEX_FLOATS);
    });

    test('handles an arc by emitting at least minSubdivisions segments', () => {
        const events: DrawEvent[] = [
            {
                kind: 'arc',
                x0: 0,
                y0: 0,
                x1: 100,
                y1: 0,
                radius: 50,
                large: false,
                sweep: true,
                color: 0xffffff,
                thickness: 1,
            },
        ];
        const { lines } = eventsToSegments(events);
        const segments = lines.length / SEGMENT_FLOATS;
        expect(segments).toBeGreaterThanOrEqual(8);
        expect(segments).toBeLessThanOrEqual(16);
    });

    test('packColorRgba bit-casts a 0xRRGGBB color into a Float32 we can recover', () => {
        const bits = packColorRgba(0x336699);
        const buf = new ArrayBuffer(4);
        new Float32Array(buf)[0] = bits;
        const u32 = new Uint32Array(buf)[0]!;
        expect(u32 >>> 0).toBe(0x336699ff >>> 0);
    });

    test('malformed poly (unclosed) is flushed at end of stream', () => {
        const events: DrawEvent[] = [
            { kind: 'poly-start', x: 0, y: 0, color: 0xffffff },
            { kind: 'poly-point', x: 1, y: 0 },
            { kind: 'poly-point', x: 0, y: 1 },
            // no poly-end
        ];
        const { polygons, lines } = eventsToSegments(events);
        expect(polygons.length).toBe(1 * 3 * POLY_VERTEX_FLOATS);
        expect(lines.length).toBe(3 * SEGMENT_FLOATS);
    });
});
