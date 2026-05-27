import type { ChangeEvent } from 'react';
import { hexToRgb, rgbToHsv, type HSV } from '@elise/engine';
import styles from './ColorPicker.module.css';

export type ColorPickerProps = {
    /** Current color expressed as `#rrggbb`. */
    value: string;
    onChange: (hex: string, hsv: HSV) => void;
};

function hexStringToInt(s: string): number {
    return parseInt(s.replace(/^#/, ''), 16) || 0;
}

function ColorPicker({ value, onChange }: ColorPickerProps): JSX.Element {
    const handle = (e: ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value;
        const rgb = hexToRgb(hexStringToInt(hex));
        onChange(hex, rgbToHsv(rgb));
    };
    return (
        <div className={styles.root}>
            <label htmlFor="line-color" className={styles.label}>
                Line color
            </label>
            <input
                id="line-color"
                type="color"
                value={value}
                onChange={handle}
                className={styles.input}
            />
        </div>
    );
}

export default ColorPicker;
