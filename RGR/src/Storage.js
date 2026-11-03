import { readFile, writeFile } from "node:fs/promises";
import { Document } from "./Document.js";

export class DocumentStorage {
  async save(document, path) {
    await writeFile(path, JSON.stringify(document.toJSON(), null, 2), "utf8");
  }

  async load(path) {
    const content = await readFile(path, "utf8");
    return Document.fromJSON(JSON.parse(content));
  }

  async exportSvg(document, path) {
    await writeFile(path, document.toSvg(), "utf8");
  }
}

export const documentStorage = new DocumentStorage();