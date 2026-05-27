import { hsvToHex } from './color';
import { Turtle, type TurtleConfig } from './turtle';

export type DrawEvent =
    | {
          kind: 'line';
          x0: number;
          y0: number;
          x1: number;
          y1: number;
          color: number;
          thickness: number;
      }
    | { kind: 'move'; x: number; y: number }
    | { kind: 'poly-start'; x: number; y: number; color: number }
    | { kind: 'poly-point'; x: number; y: number }
    | { kind: 'poly-end' }
    | { kind: 'style'; color: number; thickness: number }
    | {
          kind: 'arc';
          x0: number;
          y0: number;
          x1: number;
          y1: number;
          radius: number;
          large: boolean;
          sweep: boolean;
          color: number;
          thickness: number;
      };

export type InterpretOptions = TurtleConfig & {
    angle?: number;
    ratio?: number;
};

type ParsedArgs = {
    args: number[];
    end: number;
};

function parseArgs(s: string, pos: number): ParsedArgs {
    if (s[pos + 1] !== '(') return { args: [], end: pos };
    const args: number[] = [];
    let current = '';
    let j = pos + 2;
    while (j < s.length) {
        const ch = s[j]!;
        if (ch === ')') {
            if (current.length > 0) args.push(Number(current));
            return { args, end: j };
        }
        if (ch === ',') {
            args.push(Number(current));
            current = '';
        } else {
            current += ch;
        }
        j++;
    }
    if (current.length > 0) args.push(Number(current));
    return { args, end: s.length - 1 };
}

export function interpret(system: string, options: InterpretOptions = {}): DrawEvent[] {
    const angle = options.angle ?? 90;
    const ratio = options.ratio ?? 0.99;
    const t = new Turtle(options);
    const events: DrawEvent[] = [];

    events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });

    let i = 0;
    while (i < system.length) {
        const ch = system[i]!;
        const { args, end } = parseArgs(system, i);
        i = end;

        switch (ch) {
            case 'F':
            case 'G': {
                const x0 = t.x,
                    y0 = t.y;
                t.moveForward(args.length === 1 ? t.lineLength * args[0]! : t.lineLength);
                events.push({
                    kind: 'line',
                    x0,
                    y0,
                    x1: t.x,
                    y1: t.y,
                    color: hsvToHex(t.hsv),
                    thickness: t.lineThickness,
                });
                break;
            }
            case 'B': {
                const x0 = t.x,
                    y0 = t.y;
                t.moveBackward(args.length === 1 ? t.lineLength * args[0]! : t.lineLength);
                events.push({
                    kind: 'line',
                    x0,
                    y0,
                    x1: t.x,
                    y1: t.y,
                    color: hsvToHex(t.hsv),
                    thickness: t.lineThickness,
                });
                break;
            }
            case 'f':
            case 'g': {
                t.moveForward(args.length === 1 ? t.lineLength * args[0]! : t.lineLength);
                events.push({ kind: 'move', x: t.x, y: t.y });
                break;
            }
            case '+':
                t.rotateLeft(args.length === 1 ? args[0]! : angle);
                break;
            case '-':
                t.rotateRight(args.length === 1 ? args[0]! : angle);
                break;
            case '$':
                t.resetRotation();
                break;
            case '!':
                t.lineLength *= args.length === 1 ? args[0]! : ratio;
                break;
            case '@':
                t.lineLength /= args.length === 1 ? args[0]! : ratio;
                break;
            case '[':
                t.pushState();
                break;
            case ']': {
                t.popState();
                events.push({ kind: 'move', x: t.x, y: t.y });
                break;
            }
            case 'V': {
                if (args.length === 1) t.hsv.v = args[0]!;
                else t.brightnessUp();
                events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });
                break;
            }
            case 'v':
                t.brightnessDown();
                events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });
                break;
            case 'C': {
                if (args.length === 1) t.hsv.h = args[0]!;
                else if (args.length === 3) {
                    t.hsv.h = args[0]!;
                    t.hsv.s = args[1]!;
                    t.hsv.v = args[2]!;
                } else t.hueUp();
                events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });
                break;
            }
            case 'c':
                t.hueDown();
                events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });
                break;
            case 'S': {
                if (args.length === 1) t.hsv.s = args[0]!;
                else t.saturationUp();
                events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });
                break;
            }
            case 's':
                t.saturationDown();
                events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });
                break;
            case '{':
                events.push({ kind: 'poly-start', x: t.x, y: t.y, color: hsvToHex(t.hsv) });
                break;
            case '}':
                events.push({ kind: 'poly-end' });
                break;
            case '.':
                events.push({ kind: 'poly-point', x: t.x, y: t.y });
                break;
            case '\\':
                t.lineThickness = t.lineThickness < 0.01 ? 0 : t.lineThickness / 1.2;
                events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });
                break;
            case '/':
                t.lineThickness = t.lineThickness < 0.01 ? 0.01 : t.lineThickness * 1.2;
                events.push({ kind: 'style', color: hsvToHex(t.hsv), thickness: t.lineThickness });
                break;
            default:
                break;
        }
        i++;
    }

    return events;
}
