import { Rectangle } from "./Rectangle.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
import { BoxShape } from "./BoxShape.js";
import { ArcShape } from "./ArcShape.js";
import { GenericShape } from "./GenericShape.js";

const BOX_FIELDS = ["x", "y", "width", "height"];
const LINE_FIELDS = ["x1", "y1", "x2", "y2"];
const ARC_FIELDS = ["cx", "cy", "r", "start", "end"];

const BOX_TYPES = new Set([
  "square",
  "rhombus",
  "diamond",
  "cube",
  "cylinder",
  "triangle",
  "roundedrect",
  "roundedrectangle",
  "star",
  "callout",
  "speechbubble",
  "flowdecision",
  "flowprocess",
  "flowterminator",
  "cuboid",
  "pyramid",
  "cone",
  "sphere",
  "parallelogram",
  "text",
  "label",
  "polygon",
  "polyline",
  "bezier",
]);

export class ShapeFactory {
  constructor() {
    this._fields = new Map();
    this._creators = new Map();

    this._fields.set(Rectangle.type, Rectangle.fields);
    this._fields.set("rect", Rectangle.fields);
    this._fields.set(Circle.type, Circle.fields);
    this._fields.set(Ellipse.type, Ellipse.fields);
    this._fields.set(Line.type, Line.fields);
    this._fields.set("arrow", LINE_FIELDS);

    for (const type of BOX_TYPES) {
      this._fields.set(type, BOX_FIELDS);
    }
    this._fields.set("arc", ARC_FIELDS);
    this._fields.set("sector", ARC_FIELDS);

    this._creators.set(Rectangle.type, (id, geometry, style) => new Rectangle(id, geometry, style));
    this._creators.set("rect", (id, geometry, style) => new Rectangle(id, geometry, style));
    this._creators.set("square", (id, geometry, style) => new BoxShape(id, geometry, style, "square"));
    this._creators.set(Circle.type, (id, geometry, style) => new Circle(id, geometry, style));
    this._creators.set(Ellipse.type, (id, geometry, style) => new Ellipse(id, geometry, style));
    this._creators.set(Line.type, (id, geometry, style) => new Line(id, geometry, style));
    this._creators.set("arrow", (id, geometry, style) => new Line(id, geometry, style));

    for (const type of BOX_TYPES) {
      if (type !== "square") {
        this._creators.set(type, (id, geometry, style, resolvedType) =>
          new BoxShape(id, geometry, style, resolvedType ?? type));
      }
    }
    this._creators.set("arc", (id, geometry, style) => new ArcShape(id, geometry, style, "arc"));
    this._creators.set("sector", (id, geometry, style) => new ArcShape(id, geometry, style, "sector"));
  }

  create(type, id, values) {
    const normalizedType = String(type).toLowerCase();
    const fields = this._fields.get(normalizedType);
    if (!fields) {
      throw new Error(`Невідомий тип фігури: ${type}`);
    }

    let geometry;
    if (Array.isArray(values) && values.length === fields.length) {
      geometry = Object.fromEntries(fields.map((field, index) => [field, values[index]]));
    } else if (values && typeof values === "object" && !Array.isArray(values)) {
      geometry = { ...values };
    } else {
      throw new Error(`Для фігури "${normalizedType}" потрібно параметрів: ${fields.length}`);
    }

    const creator = this._creators.get(normalizedType) ?? ((shapeId, shapeGeometry, shapeStyle) =>
      new GenericShape(shapeId, shapeGeometry, shapeStyle, normalizedType));
    return creator(id, geometry, undefined, normalizedType);
  }

  restore(data) {
    const normalizedType = String(data.type).toLowerCase();
    const creator = this._creators.get(normalizedType) ?? ((id, geometry, style) =>
      new GenericShape(id, geometry, style, normalizedType));
    return creator(data.id, { ...data.geometry }, data.style, normalizedType);
  }
}

export const shapeFactory = new ShapeFactory();