import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { Editor } from "../src/Editor.js";

test("Editor executes add and list", async () => {
  const editor = new Editor();
  const added = await editor.execute("add rect 1 2 3 4");
  assert.match(added, /Додано/);
  const listed = await editor.execute("list");
  assert.match(listed, /rectangle/);
});

test("Editor handles unknown command", async () => {
  const editor = new Editor();
  await assert.rejects(() => editor.execute("frob"), /Невідома команда/);
});

test("Editor save/load round-trip", async () => {
  const dir = await mkdtemp(join(tmpdir(), "rgr-"));
  const path = join(dir, "doc.json");
  const editor = new Editor();
  await editor.execute("add circle 10 10 5");
  await editor.execute(`save ${path}`);
  const editor2 = new Editor();
  const msg = await editor2.execute(`load ${path}`);
  assert.match(msg, /Відкрито/);
  const json = editor2.documentToJSON();
  assert.equal(json.shapes.length, 1);
  assert.equal(json.shapes[0].type, "circle");
  await rm(dir, { recursive: true, force: true });
});

test("Editor export svg", async () => {
  const dir = await mkdtemp(join(tmpdir(), "rgr-"));
  const path = join(dir, "out.svg");
  const editor = new Editor();
  await editor.execute("add line 0 0 10 10");
  await editor.execute(`export ${path}`);
  const { readFile } = await import("node:fs/promises");
  const svg = await readFile(path, "utf8");
  assert.match(svg, /<line /);
  await rm(dir, { recursive: true, force: true });
});