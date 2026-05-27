import type { ChangeEvent } from 'react';
import styles from './SliderField.module.css';

export type SliderFieldProps = {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (next: number) => void;
};

function SliderField({
    label,
    value,
    min,
    max,
    step = 1,
    onChange,
}: SliderFieldProps): JSX.Element {
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(n);
    };
    const id = `slider-${label.replace(/\s+/g, '-').toLowerCase()}`;
    return (
        <div className={styles.root}>
            <label htmlFor={id} className={styles.label}>
                {label}
            </label>
            <div className={styles.row}>
                <input
                    id={id}
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    className={styles.range}
                />
                <input
                    type="number"
                    aria-label={`${label} value`}
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={handleChange}
                    className={styles.number}
                />
            </div>
        </div>
    );
}

export default SliderField;
