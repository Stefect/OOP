import { TypedShape } from "./TypedShape.js";

export class BoxShape extends TypedShape {
  static tag = "rect";
  static nonNegativeFields = ["width", "height"];

  constructor(id, geometry, style = {}, type = "box") {
    super(id, geometry, style, type);
  }

  move(dx, dy) {
    this._geometry.x += dx;
    this._geometry.y += dy;
  }
}