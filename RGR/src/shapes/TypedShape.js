import { Shape } from "./Shape.js";

export class TypedShape extends Shape {
  constructor(id, geometry, style = {}, type = "shape") {
    super(id, geometry, style);
    this._type = type;
  }

  get type() {
    return this._type;
  }
}