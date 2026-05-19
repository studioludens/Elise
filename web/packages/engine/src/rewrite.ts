import type { Rule } from "./rules.js";

export interface RewriteOptions {
  maxLength?: number;
}

export const DEFAULT_MAX_LENGTH = 250_000;

export class MaxLengthExceededError extends Error {
  constructor(public readonly limit: number) {
    super(`L-system exceeded max length of ${limit}`);
    this.name = "MaxLengthExceededError";
  }
}

export function rewrite(
  axiom: string,
  rules: Rule[],
  iterations: number,
  options: RewriteOptions = {},
): string {
  const max = options.maxLength ?? DEFAULT_MAX_LENGTH;
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    let inArgs = false;
    for (let j = 0; j < current.length; j++) {
      const ch = current[j]!;
      if (inArgs) {
        next += ch;
        if (ch === ")") inArgs = false;
        continue;
      }
      if (ch === "(") {
        next += ch;
        inArgs = true;
        continue;
      }
      const matched = rules.find((r) => r.axiom === ch);
      next += matched ? matched.rule : ch;
      if (next.length > max) throw new MaxLengthExceededError(max);
    }
    current = next;
  }
  return current;
}
