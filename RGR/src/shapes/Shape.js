import { DEFAULT_STYLE } from "../constants.js";

export class Shape {
  static type = "shape";
  static tag = "g";
  static fields = [];
  static nonNegativeFields = [];

  constructor(id, geometry, style = {}) {
    this._id = id;
    this._geometry = this._clone(geometry ?? {});
    this._style = { ...DEFAULT_STYLE, ...style };
    this._validateGeometry(this._geometry);
  }

  get id() {
    return this._id;
  }

  get type() {
    return this.constructor.type;
  }

  get tag() {
    return this.constructor.tag;
  }

  get geometry() {
    return this._clone(this._geometry);
  }

  get style() {
    return this._clone(this._style);
  }

  move(dx, dy) {
    throw new Error("Метод move має бути реалізований у нащадку");
  }

  describe() {
    const geometry = Object.entries(this._geometry)
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
    return `#${this._id} ${this.type} ${geometry}`;
  }

  toJSON() {
    return {
      id: this._id,
      type: this.type,
      geometry: this._clone(this._geometry),
      style: this._clone(this._style),
    };
  }

  toSvg() {
    const attributes = {
      ...this._geometry,
      fill: this._style.fill,
      stroke: this._style.stroke,
      "stroke-width": this._style.strokeWidth,
    };
    const text = Object.entries(attributes)
      .map(([key, value]) => `${key}="${value}"`)
      .join(" ");
    return `<${this.tag} ${text} />`;
  }

  _clone(value) {
    return structuredClone(value);
  }

  _validateGeometry(geometry) {
    for (const field of this.constructor.nonNegativeFields ?? []) {
      const value = geometry?.[field];
      if (typeof value === "number" && value < 0) {
        throw new Error(`Поле "${field}" не може бути від'ємним`);
      }
    }
  }
}