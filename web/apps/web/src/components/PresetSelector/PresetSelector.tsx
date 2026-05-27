import type { ChangeEvent } from 'react';
import { PRESETS, type Preset } from '@elise/engine';
import styles from './PresetSelector.module.css';

export type PresetSelectorProps = {
    value: string;
    onChange: (preset: Preset) => void;
};

function PresetSelector({ value, onChange }: PresetSelectorProps): JSX.Element {
    const handle = (e: ChangeEvent<HTMLSelectElement>) => {
        const name = e.target.value;
        const preset = PRESETS.find((p) => p.name === name);
        if (preset) onChange(preset);
    };
    const customLabel = PRESETS.some((p) => p.name === value) ? null : value;
    return (
        <div className={styles.root}>
            <label htmlFor="preset" className={styles.label}>
                Preset
            </label>
            <select id="preset" value={value} onChange={handle}>
                {customLabel !== null && (
                    <option key="__custom" value={customLabel}>
                        {customLabel} (custom)
                    </option>
                )}
                {PRESETS.map((p) => (
                    <option key={p.name} value={p.name}>
                        {p.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default PresetSelector;
