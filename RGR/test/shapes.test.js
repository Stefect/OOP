import { test } from "node:test";
import assert from "node:assert/strict";

import { shapeFactory } from "../src/shapes/factory.js";
import { Shape } from "../src/shapes/Shape.js";

test("ShapeFactory creates rectangle with geometry", () => {
  const shape = shapeFactory.create("rect", 1, [1, 2, 3, 4]);
  assert.equal(shape.id, 1);
  assert.equal(shape.type, "rectangle");
  assert.deepEqual(shape.geometry, { x: 1, y: 2, width: 3, height: 4 });
});

test("ShapeFactory restore round-trips", () => {
  const original = shapeFactory.create("circle", 7, [10, 20, 5]);
  const restored = shapeFactory.restore(original.toJSON());
  assert.equal(restored.id, 7);
  assert.equal(restored.type, "circle");
  assert.deepEqual(restored.geometry, { cx: 10, cy: 20, r: 5 });
});

test("ShapeFactory rejects unknown type", () => {
  assert.throws(() => shapeFactory.create("unknown", 1, [1]), /Невідомий тип/);
});

test("ShapeFactory validates non-negative fields", () => {
  assert.throws(() => shapeFactory.create("rect", 1, [1, 2, -3, 4]), /не може бути від'ємним/);
});

test("Shape encapsulates geometry (no external mutation)", () => {
  const shape = shapeFactory.create("rect", 1, [1, 2, 3, 4]);
  const geometry = shape.geometry;
  geometry.x = 999;
  assert.equal(shape.geometry.x, 1);
});

test("Shape move updates geometry", () => {
  const shape = shapeFactory.create("rect", 1, [1, 2, 3, 4]);
  shape.move(5, -1);
  assert.deepEqual(shape.geometry, { x: 6, y: 1, width: 3, height: 4 });
});

test("Shape toJSON returns copies", () => {
  const shape = shapeFactory.create("rect", 1, [1, 2, 3, 4]);
  const json = shape.toJSON();
  json.geometry.x = 999;
  assert.equal(shape.geometry.x, 1);
});

test("BoxShape renders rect svg", () => {
  const shape = shapeFactory.create("cube", 2, [0, 0, 10, 10]);
  assert.match(shape.toSvg(), /^<rect /);
});

test("GenericShape renders g svg", () => {
  // Force generic by unknown-ish: use factory internal fallback via restore of custom type not registered
  const data = { id: 9, type: "widget", geometry: { x: 1 }, style: {} };
  // GenericShape is used for unregistered types in restore
  const shape = shapeFactory.restore(data);
  assert.match(shape.toSvg(), /^<g data-type="widget" \/>/);
});