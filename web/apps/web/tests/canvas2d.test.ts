import { describe, expect, test } from 'vitest';
import type { DrawEvent } from '@elise/engine';
import { computeBounds, fitView, zoomAt } from '../src/canvas2d';

describe('canvas2d helpers', () => {
    test('computeBounds returns a sane default for empty input', () => {
        const b = computeBounds([]);
        expect(b.minX).toBeLessThan(b.maxX);
        expect(b.minY).toBeLessThan(b.maxY);
    });

    test('computeBounds covers line endpoints', () => {
        const events: DrawEvent[] = [
            { kind: 'line', x0: 0, y0: 0, x1: 100, y1: 50, color: 0, thickness: 1 },
            { kind: 'line', x0: -20, y0: 10, x1: 30, y1: 80, color: 0, thickness: 1 },
        ];
        expect(computeBounds(events)).toEqual({ minX: -20, minY: 0, maxX: 100, maxY: 80 });
    });

    test('fitView centers content within padded canvas', () => {
        const view = fitView({ minX: 0, minY: 0, maxX: 100, maxY: 100 }, 400, 400, 20);
        expect(view.scale).toBeCloseTo(3.6); // (400 - 40) / 100
        // The centered offset for an exactly-square content area is just `padding`.
        expect(view.offsetX).toBeCloseTo(20);
        expect(view.offsetY).toBeCloseTo(20);
    });

    test('zoomAt keeps the screen anchor fixed', () => {
        const view = { scale: 1, offsetX: 0, offsetY: 0 };
        const next = zoomAt(view, 2, 100, 100);
        // The world point that maps to (100, 100) before zoom is (100, 100).
        // After zoom, the same world point should still map to (100, 100).
        const screenX = 100 * next.scale + next.offsetX;
        const screenY = 100 * next.scale + next.offsetY;
        expect(screenX).toBeCloseTo(100);
        expect(screenY).toBeCloseTo(100);
    });
});
