import { CANVAS } from "./constants.js";
import { shapeFactory } from "./shapes/factory.js";

export class Document {
  #shapes = new Map();
  #groups = new Map();
  #nextId = 1;
  #nextGroupId = 1;

  add(type, values) {
    const shape = shapeFactory.create(type, this.#nextId, values);
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
    for (const [groupId, members] of [...this.#groups]) {
      members.delete(id);
      if (members.size < 2) {
        this.#groups.delete(groupId);
      }
    }
  }

  move(id, dx, dy) {
    const members = this.#groupMembers(id);
    for (const memberId of members) {
      this.get(memberId).move(dx, dy);
    }
  }

  group(ids) {
    const valid = ids.filter((id) => this.#shapes.has(id));
    if (valid.length < 2) {
      throw new Error("Для групи потрібно щонайменше 2 фігури");
    }
    const groupId = this.#nextGroupId++;
    this.#groups.set(groupId, new Set(valid));
    return groupId;
  }

  ungroup(groupId) {
    if (!this.#groups.has(groupId)) {
      throw new Error(`Групу ${groupId} не знайдено`);
    }
    this.#groups.delete(groupId);
  }

  groupOf(id) {
    for (const [groupId, members] of this.#groups) {
      if (members.has(id)) return groupId;
    }
    return null;
  }

  groupMembers(id) {
    const groupId = this.groupOf(id);
    if (groupId === null) return [id];
    return [...this.#groups.get(groupId)];
  }

  groups() {
    return Object.fromEntries(
      [...this.#groups].map(([id, members]) => [id, [...members]]),
    );
  }

  #groupMembers(id) {
    return this.groupMembers(id);
  }

  duplicate(id, dx = 10, dy = 10) {
    const original = this.get(id);
    const copy = shapeFactory.restore({ ...original.toJSON(), id: this.#nextId });
    copy.move(dx, dy);
    this.#insert(copy);
    return copy;
  }

  list() {
    return Object.freeze([...this.#shapes.values()]);
  }

  toJSON() {
    return {
      shapes: this.list().map((shape) => shape.toJSON()),
      groups: this.groups(),
    };
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
      document.#insert(shapeFactory.restore(item));
    }
    const groups = data.groups ?? {};
    for (const [groupId, members] of Object.entries(groups)) {
      document.#groups.set(Number(groupId), new Set(members));
      document.#nextGroupId = Math.max(document.#nextGroupId, Number(groupId) + 1);
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
