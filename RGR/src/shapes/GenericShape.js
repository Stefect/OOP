import { TypedShape } from "./TypedShape.js";

export class GenericShape extends TypedShape {
  static tag = "g";

  constructor(id, geometry, style = {}, type = "shape") {
    super(id, geometry, style, type);
  }

  move(dx, dy) {
    const points = this._geometry?.points;
    if (Array.isArray(points)) {
      for (const point of points) {
        point.x += dx;
        point.y += dy;
      }
    }
  }

  toSvg() {
    return `<g data-type="${this.type}" />`;
  }
}