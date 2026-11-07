import { test } from "node:test";
import assert from "node:assert/strict";

import { Document } from "../src/Document.js";
import { shapeFactory } from "../src/shapes/factory.js";

test("Document add and get", () => {
  const doc = new Document();
  const shape = doc.add("rect", [1, 2, 3, 4]);
  assert.equal(shape.id, 1);
  assert.equal(doc.get(1).id, 1);
});

test("Document remove deletes shape", () => {
  const doc = new Document();
  doc.add("rect", [1, 2, 3, 4]);
  doc.remove(1);
  assert.throws(() => doc.get(1));
});

test("Document move updates shape", () => {
  const doc = new Document();
  doc.add("rect", [1, 2, 3, 4]);
  doc.move(1, 5, 5);
  assert.deepEqual(doc.get(1).geometry, { x: 6, y: 7, width: 3, height: 4 });
});

test("Document list is frozen and does not leak mutation", () => {
  const doc = new Document();
  doc.add("rect", [1, 2, 3, 4]);
  const list = doc.list();
  assert.ok(Object.isFrozen(list));
  assert.throws(() => list.push(shapeFactory.create("rect", 99, [0, 0, 1, 1])));
  assert.equal(doc.list().length, 1);
});

test("Document fromJSON/toJSON round-trip", () => {
  const doc = new Document();
  doc.add("circle", [10, 20, 5]);
  const json = doc.toJSON();
  const restored = Document.fromJSON(json);
  assert.deepEqual(restored.toJSON(), json);
});

test("Document duplicate creates copy with offset", () => {
  const doc = new Document();
  doc.add("rect", [1, 2, 3, 4]);
  const copy = doc.duplicate(1, 5, 5);
  assert.equal(copy.id, 2);
  assert.deepEqual(copy.geometry, { x: 6, y: 7, width: 3, height: 4 });
  assert.equal(doc.list().length, 2);
});

test("Document group moves all members", () => {
  const doc = new Document();
  doc.add("rect", [1, 2, 3, 4]);
  doc.add("rect", [5, 6, 3, 4]);
  const groupId = doc.group([1, 2]);
  assert.equal(typeof groupId, "number");
  doc.move(1, 10, 10);
  assert.deepEqual(doc.get(1).geometry, { x: 11, y: 12, width: 3, height: 4 });
  assert.deepEqual(doc.get(2).geometry, { x: 15, y: 16, width: 3, height: 4 });
  doc.ungroup(groupId);
  doc.move(1, 5, 5);
  assert.deepEqual(doc.get(2).geometry, { x: 15, y: 16, width: 3, height: 4 });
});

test("Document toJSON/fromJSON preserves groups", () => {
  const doc = new Document();
  doc.add("rect", [1, 2, 3, 4]);
  doc.add("rect", [5, 6, 3, 4]);
  doc.group([1, 2]);
  const json = doc.toJSON();
  const restored = Document.fromJSON(json);
  assert.deepEqual(restored.toJSON().groups, json.groups);
  assert.equal(restored.groupOf(1), restored.groupOf(2));
});

test("Document rejects duplicate id on insert via fromJSON gracefully", () => {
  // duplicate ids in data should not crash; #insert guards
  const data = { shapes: [
    { id: 1, type: "rect", geometry: { x: 0, y: 0, width: 1, height: 1 }, style: {} },
    { id: 1, type: "rect", geometry: { x: 2, y: 2, width: 1, height: 1 }, style: {} },
  ] };
  assert.throws(() => Document.fromJSON(data));
});