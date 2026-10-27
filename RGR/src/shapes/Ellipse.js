import { Shape } from "./Shape.js";

export class Ellipse extends Shape {
  static type = "ellipse";
  static tag = "ellipse";
  static fields = ["cx", "cy", "rx", "ry"];
  static nonNegativeFields = ["rx", "ry"];

  move(dx, dy) {
    this.geometry.cx += dx;
    this.geometry.cy += dy;
  }
}