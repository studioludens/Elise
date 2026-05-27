import type { ChangeEvent } from 'react';
import { parseRules } from '@elise/engine';
import styles from './RuleEditor.module.css';

export type RuleEditorProps = {
    value: string;
    onChange: (next: string) => void;
};

function RuleEditor({ value, onChange }: RuleEditorProps): JSX.Element {
    const handle = (e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value);
    const ruleCount = parseRules(value).length;
    return (
        <div className={styles.root}>
            <label htmlFor="rules" className={styles.label}>
                <span>Rules</span>
                <span className={styles.count} data-testid="rule-count">
                    {ruleCount} rule{ruleCount === 1 ? '' : 's'}
                </span>
            </label>
            <textarea
                id="rules"
                value={value}
                onChange={handle}
                rows={6}
                spellCheck={false}
                autoComplete="off"
                className={styles.textarea}
            />
        </div>
    );
}

export default RuleEditor;
