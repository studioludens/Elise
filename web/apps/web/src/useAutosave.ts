import { useEffect } from 'react';
import type { LsysFile } from '@elise/engine';
import { saveState } from './storage';

const DEBOUNCE_MS = 400;

export function useAutosave(file: LsysFile): void {
    useEffect(() => {
        const t = setTimeout(() => saveState(file), DEBOUNCE_MS);
        return () => clearTimeout(t);
    }, [file]);
}
