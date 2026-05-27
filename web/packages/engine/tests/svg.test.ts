import { describe, expect, test } from 'vitest';
import { interpret } from '../src/interpret';
import { exportSvg } from '../src/svg';

describe('exportSvg', () => {
    test('wraps output in an svg element', () => {
        const events = interpret('F', { initialLineLength: 10 });
        const svg = exportSvg(events, { width: 100, height: 100 });
        expect(svg.startsWith('<svg')).toBe(true);
        expect(svg.endsWith('</svg>')).toBe(true);
        expect(svg).toContain('viewBox="0 0 100 100"');
    });

    test('contains a stroked path for a simple line', () => {
        const events = interpret('F', { initialLineLength: 10 });
        const svg = exportSvg(events);
        expect(svg).toContain('<path');
        expect(svg).toContain('stroke="rgb(255,77,77)"');
    });

    test('includes a background rect when requested', () => {
        const events = interpret('F', { initialLineLength: 10 });
        const svg = exportSvg(events, { background: '#000' });
        expect(svg).toContain('<rect width="800" height="800" fill="#000"/>');
    });

    test('emits polygons as filled paths', () => {
        const events = interpret('{.F.F.}', { angle: 90, initialLineLength: 5 });
        const svg = exportSvg(events);
        expect(svg).toContain('fill-opacity="0.4"');
    });
});
