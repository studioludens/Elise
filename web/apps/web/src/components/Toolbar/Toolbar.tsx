import styles from './Toolbar.module.css';

export type ToolbarProps = {
    onExportSvg: () => void;
    onSaveLsys: () => void;
    onOpenLsys: () => void;
    onResetPreset: () => void;
};

function Toolbar({
    onExportSvg,
    onSaveLsys,
    onOpenLsys,
    onResetPreset,
}: ToolbarProps): JSX.Element {
    return (
        <div className={styles.root}>
            <button type="button" className={styles.button} onClick={onExportSvg}>
                Export SVG
            </button>
            <button type="button" className={styles.button} onClick={onSaveLsys}>
                Save .lsys
            </button>
            <button type="button" className={styles.button} onClick={onOpenLsys}>
                Open .lsys
            </button>
            <button type="button" className={styles.button} onClick={onResetPreset}>
                Reset to preset
            </button>
        </div>
    );
}

export default Toolbar;
