import { Shape } from "./Shape.js";

export class Line extends Shape {
  static type = "line";
  static tag = "line";
  static fields = ["x1", "y1", "x2", "y2"];

  move(dx, dy) {
    this._geometry.x1 += dx;
    this._geometry.y1 += dy;
    this._geometry.x2 += dx;
    this._geometry.y2 += dy;
  }
}