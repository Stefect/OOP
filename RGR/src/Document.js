import { CANVAS } from "./constants.js";
import { createShape, restoreShape } from "./shapes/factory.js";

export class Document {
  #shapes = new Map();
  #nextId = 1;

  add(type, values) {
    const shape = createShape(type, this.#nextId, values);
    this.#insert(shape);
    return shape;
  }

  get(id) {
    const shape = this.#shapes.get(id);
    if (!shape) {
      throw new Error(`Фігуру з id ${id} не знайдено`);
    }
    return shape;
  }

  remove(id) {
    this.get(id);
    this.#shapes.delete(id);
  }

  move(id, dx, dy) {
    this.get(id).move(dx, dy);
  }

  list() {
    return [...this.#shapes.values()];
  }

  toJSON() {
    return { shapes: this.list().map((shape) => shape.toJSON()) };
  }

  toSvg() {
    const body = this.list()
      .map((shape) => `  ${shape.toSvg()}`)
      .join("\n");
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.width}" height="${CANVAS.height}">`,
      body,
      "</svg>",
      "",
    ].join("\n");
  }

  static fromJSON(data) {
    const document = new Document();
    for (const item of data.shapes ?? []) {
      document.#insert(restoreShape(item));
    }
    return document;
  }

  #insert(shape) {
    if (this.#shapes.has(shape.id)) {
      throw new Error(`Фігура з id ${shape.id} вже існує`);
    }
    this.#shapes.set(shape.id, shape);
    this.#nextId = Math.max(this.#nextId, shape.id + 1);
  }
}
