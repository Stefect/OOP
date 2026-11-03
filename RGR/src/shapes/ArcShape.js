import { TypedShape } from "./TypedShape.js";

export class ArcShape extends TypedShape {
  static tag = "circle";
  static nonNegativeFields = ["r"];

  constructor(id, geometry, style = {}, type = "arc") {
    super(id, geometry, style, type);
  }

  move(dx, dy) {
    this._geometry.cx += dx;
    this._geometry.cy += dy;
  }
}