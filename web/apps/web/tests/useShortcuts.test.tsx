import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { useShortcuts, type Shortcuts } from '../src/useShortcuts';

function Harness(props: Shortcuts): JSX.Element {
    useShortcuts(props);
    return <div data-testid="harness" />;
}

afterEach(cleanup);

describe('useShortcuts', () => {
    test('Cmd+S triggers onSave', () => {
        const onSave = vi.fn();
        render(<Harness onSave={onSave} />);
        fireEvent.keyDown(window, { key: 's', metaKey: true });
        expect(onSave).toHaveBeenCalledTimes(1);
    });

    test('Ctrl+O triggers onOpen', () => {
        const onOpen = vi.fn();
        render(<Harness onOpen={onOpen} />);
        fireEvent.keyDown(window, { key: 'o', ctrlKey: true });
        expect(onOpen).toHaveBeenCalledTimes(1);
    });

    test('plain S does not trigger onSave', () => {
        const onSave = vi.fn();
        render(<Harness onSave={onSave} />);
        fireEvent.keyDown(window, { key: 's' });
        expect(onSave).not.toHaveBeenCalled();
    });

    test('Cmd+R skips reset while typing in an input', () => {
        const onReset = vi.fn();
        render(
            <>
                <input data-testid="i" />
                <Harness onReset={onReset} />
            </>,
        );
        const input = document.querySelector('input')!;
        input.focus();
        fireEvent.keyDown(input, { key: 'r', metaKey: true });
        expect(onReset).not.toHaveBeenCalled();
    });

    test('Cmd+E triggers onExport', () => {
        const onExport = vi.fn();
        render(<Harness onExport={onExport} />);
        fireEvent.keyDown(window, { key: 'e', metaKey: true });
        expect(onExport).toHaveBeenCalledTimes(1);
    });
});
