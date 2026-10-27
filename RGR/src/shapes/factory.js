import { Rectangle } from "./Rectangle.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
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

const SHAPE_FIELDS = new Map([
  [Rectangle.type, Rectangle.fields],
  ["rect", Rectangle.fields],
  [Circle.type, Circle.fields],
  [Ellipse.type, Ellipse.fields],
  [Line.type, Line.fields],
  ["arrow", LINE_FIELDS],
]);

for (const type of BOX_TYPES) {
  SHAPE_FIELDS.set(type, BOX_FIELDS);
}
SHAPE_FIELDS.set("arc", ARC_FIELDS);
SHAPE_FIELDS.set("sector", ARC_FIELDS);

function creatorFor(type) {
  if (type === Rectangle.type || type === "rect" || type === "square") return (id, geometry, style) => new Rectangle(id, geometry, style);
  if (type === Circle.type) return (id, geometry, style) => new Circle(id, geometry, style);
  if (type === Ellipse.type) return (id, geometry, style) => new Ellipse(id, geometry, style);
  if (type === Line.type || type === "arrow") return (id, geometry, style) => new Line(id, geometry, style);
  return (id, geometry, style) => new GenericShape(id, geometry, style, type);
}

export function resolveShapeClass(type) {
  return creatorFor(type) ? GenericShape : null;
}

export function createShape(type, id, values) {
  const normalizedType = String(type).toLowerCase();
  const fields = SHAPE_FIELDS.get(normalizedType);
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

  for (const field of ["width", "height", "r", "rx", "ry", "start", "end"]) {
    // non-negative where applicable
  }

  const creator = creatorFor(normalizedType);
  return creator(id, geometry, undefined, normalizedType);
}

export function restoreShape(data) {
  const normalizedType = String(data.type).toLowerCase();
  const creator = creatorFor(normalizedType);
  if (!creator) {
    throw new Error(`Невідомий тип фігури: ${data.type}`);
  }
  return creator(data.id, { ...data.geometry }, data.style, normalizedType);
}