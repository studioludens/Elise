import { useEffect } from 'react';

export type Shortcuts = {
    onSave?: () => void;
    onOpen?: () => void;
    onReset?: () => void;
    onExport?: () => void;
};

function isInEditableField(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    const tag = target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
    return target.isContentEditable;
}

export function useShortcuts(s: Shortcuts): void {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const mod = e.metaKey || e.ctrlKey;
            if (!mod) return;
            // Don't steal Cmd+A / Cmd+C / etc. while typing in inputs.
            const key = e.key.toLowerCase();
            if (key === 's' && s.onSave) {
                e.preventDefault();
                s.onSave();
            } else if (key === 'o' && s.onOpen) {
                e.preventDefault();
                s.onOpen();
            } else if (key === 'e' && s.onExport) {
                e.preventDefault();
                s.onExport();
            } else if (key === 'r' && s.onReset && !isInEditableField(e.target)) {
                e.preventDefault();
                s.onReset();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [s.onSave, s.onOpen, s.onExport, s.onReset]);
}
