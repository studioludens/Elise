export type Rule = {
    axiom: string;
    rule: string;
};

export function parseRule(line: string): Rule | null {
    const stripped = line.replace(/\s/g, '');
    if (stripped.length < 2) return null;
    const axiom = stripped[0]!;
    if (stripped[1] !== ':') return null;
    return { axiom, rule: stripped.slice(2) };
}

export function parseRules(text: string): Rule[] {
    return text
        .split(/[\r\n]+/)
        .map(parseRule)
        .filter((r): r is Rule => r !== null);
}

export function serializeRules(rules: Rule[]): string {
    return rules.map((r) => `${r.axiom}:${r.rule}`).join('\n');
}
