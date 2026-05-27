import type { ChangeEvent } from 'react';
import styles from './AxiomInput.module.css';

export type AxiomInputProps = {
    value: string;
    onChange: (next: string) => void;
};

function AxiomInput({ value, onChange }: AxiomInputProps): JSX.Element {
    const handle = (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value);
    return (
        <div className={styles.root}>
            <label htmlFor="axiom" className={styles.label}>
                Axiom
            </label>
            <input
                id="axiom"
                type="text"
                value={value}
                onChange={handle}
                spellCheck={false}
                autoComplete="off"
                className={styles.input}
            />
        </div>
    );
}

export default AxiomInput;
