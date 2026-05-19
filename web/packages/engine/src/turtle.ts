import type { HSV } from "./color.js";

const TO_RADIANS = Math.PI / 180;

export interface TurtleState {
  x: number;
  y: number;
  angle: number;
  lineLength: number;
  lineThickness: number;
  hsv: HSV;
}

export interface TurtleConfig {
  initialAngle?: number;
  initialPosition?: { x: number; y: number };
  initialLineLength?: number;
  initialLineThickness?: number;
  initialHsv?: HSV;
  briStep?: number;
  satStep?: number;
  hueStep?: number;
}

export class Turtle {
  x: number;
  y: number;
  angle: number;
  lineLength: number;
  lineThickness: number;
  hsv: HSV;

  private readonly briStep: number;
  private readonly satStep: number;
  private readonly hueStep: number;
  private readonly stack: TurtleState[] = [];

  constructor(config: TurtleConfig = {}) {
    this.x = config.initialPosition?.x ?? 0;
    this.y = config.initialPosition?.y ?? 0;
    this.angle = config.initialAngle ?? 0;
    this.lineLength = config.initialLineLength ?? 300;
    this.lineThickness = config.initialLineThickness ?? 1;
    this.hsv = { ...(config.initialHsv ?? { h: 0, s: 0.7, v: 1 }) };
    this.briStep = config.briStep ?? 7;
    this.satStep = config.satStep ?? 5;
    this.hueStep = config.hueStep ?? 0.01;
  }

  private get dx(): number {
    return Math.sin(this.angle * TO_RADIANS);
  }

  private get dy(): number {
    return -Math.cos(this.angle * TO_RADIANS);
  }

  moveForward(length: number = this.lineLength): void {
    this.x += length * this.dx;
    this.y += length * this.dy;
  }

  moveBackward(length: number = this.lineLength): void {
    this.x -= length * this.dx;
    this.y -= length * this.dy;
  }

  rotateLeft(deg: number): void {
    this.angle -= deg;
  }

  rotateRight(deg: number): void {
    this.angle += deg;
  }

  resetRotation(): void {
    this.angle = 0;
  }

  pushState(): void {
    this.stack.push({
      x: this.x,
      y: this.y,
      angle: this.angle,
      lineLength: this.lineLength,
      lineThickness: this.lineThickness,
      hsv: { ...this.hsv },
    });
  }

  popState(): void {
    const s = this.stack.pop();
    if (!s) return;
    this.x = s.x;
    this.y = s.y;
    this.angle = s.angle;
    this.lineLength = s.lineLength;
    this.lineThickness = s.lineThickness;
    this.hsv = s.hsv;
  }

  brightnessUp(): void {
    this.hsv.v = (this.hsv.v * this.briStep + 1) / (this.briStep + 1);
  }

  brightnessDown(): void {
    this.hsv.v = (this.hsv.v * this.briStep) / (this.briStep + 1);
  }

  saturationUp(): void {
    this.hsv.s = (this.hsv.s * this.satStep + 1) / (this.satStep + 1);
  }

  saturationDown(): void {
    this.hsv.s = (this.hsv.s * this.satStep) / (this.satStep + 1);
  }

  hueUp(): void {
    this.hsv.h = (this.hsv.h + this.hueStep) % 1;
  }

  hueDown(): void {
    this.hsv.h = (this.hsv.h - this.hueStep + 1) % 1;
  }

  snapshot(): TurtleState {
    return {
      x: this.x,
      y: this.y,
      angle: this.angle,
      lineLength: this.lineLength,
      lineThickness: this.lineThickness,
      hsv: { ...this.hsv },
    };
  }
}
