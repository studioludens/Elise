import type { Rule } from "./rules.js";

export type Preset = {
  name: string;
  axiom: string;
  rules: Rule[];
  angle: number;
  iterations: number;
}

export const PRESETS: Preset[] = [
  {
    name: "Koch curve",
    axiom: "F",
    rules: [{ axiom: "F", rule: "F+F--F+F" }],
    angle: 60,
    iterations: 4,
  },
  {
    name: "Koch snowflake",
    axiom: "F++F++F",
    rules: [{ axiom: "F", rule: "F-F++F-F" }],
    angle: 60,
    iterations: 4,
  },
  {
    name: "Sierpinski triangle",
    axiom: "F-G-G",
    rules: [
      { axiom: "F", rule: "F-G+F+G-F" },
      { axiom: "G", rule: "GG" },
    ],
    angle: 120,
    iterations: 5,
  },
  {
    name: "Dragon curve",
    axiom: "FX",
    rules: [
      { axiom: "X", rule: "X+YF+" },
      { axiom: "Y", rule: "-FX-Y" },
    ],
    angle: 90,
    iterations: 10,
  },
  {
    name: "Plant",
    axiom: "X",
    rules: [
      { axiom: "X", rule: "F+[[X]-X]-F[-FX]+X" },
      { axiom: "F", rule: "FF" },
    ],
    angle: 25,
    iterations: 5,
  },
];
