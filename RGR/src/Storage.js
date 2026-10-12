import { readFile, writeFile } from "node:fs/promises";
import { Document } from "./Document.js";

export async function saveDocument(document, path) {
  await writeFile(path, JSON.stringify(document.toJSON(), null, 2), "utf8");
}

export async function loadDocument(path) {
  const content = await readFile(path, "utf8");
  return Document.fromJSON(JSON.parse(content));
}

export async function exportSvg(document, path) {
  await writeFile(path, document.toSvg(), "utf8");
}
