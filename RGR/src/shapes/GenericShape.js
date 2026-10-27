import { Shape } from "./Shape.js";

export class GenericShape extends Shape {
  constructor(id, geometry, style = {}, type = "shape") {
    super(id, geometry, style);
    this._type = type;
  }

  get type() {
    return this._type;
  }

  move(dx, dy) {
    const g = this.geometry;
    if (g && Object.prototype.hasOwnProperty.call(g, "x")) {
      g.x += dx;
      g.y += dy;
      return;
    }
    if (g && Object.prototype.hasOwnProperty.call(g, "cx")) {
      g.cx += dx;
      g.cy += dy;
      return;
    }
    if (g && Object.prototype.hasOwnProperty.call(g, "x1")) {
      g.x1 += dx;
      g.y1 += dy;
      g.x2 += dx;
      g.y2 += dy;
      return;
    }
    if (Array.isArray(g?.points)) {
      for (const point of g.points) {
        point.x += dx;
        point.y += dy;
      }
    }
  }

  toSvg() {
    const g = this.geometry || {};
    if (Object.prototype.hasOwnProperty.call(g, "x")) {
      const attributes = {
        x: g.x,
        y: g.y,
        width: g.width,
        height: g.height,
        fill: this.style.fill,
        stroke: this.style.stroke,
        "stroke-width": this.style.strokeWidth,
      };
      const text = Object.entries(attributes)
        .map(([key, value]) => `${key}="${value}"`)
        .join(" ");
      return `<rect ${text} />`;
    }
    if (Object.prototype.hasOwnProperty.call(g, "cx") && Object.prototype.hasOwnProperty.call(g, "r")) {
      return `<circle cx="${g.cx}" cy="${g.cy}" r="${g.r}" fill="${this.style.fill}" stroke="${this.style.stroke}" stroke-width="${this.style.strokeWidth}" />`;
    }
    if (Object.prototype.hasOwnProperty.call(g, "x1")) {
      return `<line x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}" stroke="${this.style.stroke}" stroke-width="${this.style.strokeWidth}" />`;
    }
    return `<g data-type="${this.type}" />`;
  }
}