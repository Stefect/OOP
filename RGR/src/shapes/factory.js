import { Rectangle } from "./Rectangle.js";
import { Circle } from "./Circle.js";
import { Line } from "./Line.js";

const SHAPE_CLASSES = new Map([
  [Rectangle.type, Rectangle],
  ["rect", Rectangle],
  [Circle.type, Circle],
  [Line.type, Line],
]);

export function resolveShapeClass(type) {
  const ShapeClass = SHAPE_CLASSES.get(type);
  if (!ShapeClass) {
    throw new Error(`Невідомий тип фігури: ${type}`);
  }
  return ShapeClass;
}

export function createShape(type, id, values) {
  const ShapeClass = resolveShapeClass(type);

  if (values.length !== ShapeClass.fields.length) {
    throw new Error(
      `Для фігури "${ShapeClass.type}" потрібно параметрів: ${ShapeClass.fields.length}`,
    );
  }

  const geometry = Object.fromEntries(
    ShapeClass.fields.map((field, index) => [field, values[index]]),
  );

  for (const field of ShapeClass.nonNegativeFields) {
    if (geometry[field] < 0) {
      throw new Error(`Параметр "${field}" не може бути від'ємним`);
    }
  }

  return new ShapeClass(id, geometry);
}

export function restoreShape(data) {
  const ShapeClass = resolveShapeClass(data.type);
  return new ShapeClass(data.id, { ...data.geometry }, data.style);
}
