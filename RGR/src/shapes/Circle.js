import { Shape } from "./Shape.js";

export class Circle extends Shape {
  static type = "circle";
  static tag = "circle";
  static fields = ["cx", "cy", "r"];
  static nonNegativeFields = ["r"];

  move(dx, dy) {
    this._geometry.cx += dx;
    this._geometry.cy += dy;
  }
}