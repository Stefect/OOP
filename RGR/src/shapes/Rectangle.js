import { Shape } from "./Shape.js";

export class Rectangle extends Shape {
  static type = "rectangle";
  static tag = "rect";
  static fields = ["x", "y", "width", "height"];
  static nonNegativeFields = ["width", "height"];

  move(dx, dy) {
    this._geometry.x += dx;
    this._geometry.y += dy;
  }
}