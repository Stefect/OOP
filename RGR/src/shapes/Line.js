import { Shape } from "./Shape.js";

export class Line extends Shape {
  static type = "line";
  static tag = "line";
  static fields = ["x1", "y1", "x2", "y2"];

  move(dx, dy) {
    this.geometry.x1 += dx;
    this.geometry.y1 += dy;
    this.geometry.x2 += dx;
    this.geometry.y2 += dy;
  }
}
