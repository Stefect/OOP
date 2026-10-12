import { DEFAULT_STYLE } from "../constants.js";

export class Shape {
  static type = "shape";
  static tag = "g";
  static fields = [];
  static nonNegativeFields = [];

  constructor(id, geometry, style = {}) {
    this.id = id;
    this.geometry = geometry;
    this.style = { ...DEFAULT_STYLE, ...style };
  }

  get type() {
    return this.constructor.type;
  }

  move(dx, dy) {
    throw new Error("Метод move має бути реалізований у нащадку");
  }

  describe() {
    const geometry = Object.entries(this.geometry)
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
    return `#${this.id} ${this.type} ${geometry}`;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      geometry: { ...this.geometry },
      style: { ...this.style },
    };
  }

  toSvg() {
    const attributes = {
      ...this.geometry,
      fill: this.style.fill,
      stroke: this.style.stroke,
      "stroke-width": this.style.strokeWidth,
    };
    const text = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");
    return `<${this.constructor.tag} ${text} />`;
  }
}
