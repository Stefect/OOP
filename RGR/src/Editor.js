import { Document } from "./Document.js";
import { exportSvg, loadDocument, saveDocument } from "./Storage.js";

const HELP = [
  "Команди:",
  "  add rect x y width height       - додати прямокутник",
  "  add circle cx cy r              - додати коло",
  "  add line x1 y1 x2 y2            - додати лінію",
  "  move id dx dy                   - перемістити фігуру",
  "  delete id                       - видалити фігуру",
  "  list                            - показати всі фігури",
  "  save файл.json                  - зберегти документ",
  "  load файл.json                  - відкрити документ",
  "  export файл.svg                 - експортувати у SVG",
  "  help                            - показати довідку",
  "  exit                            - вийти",
].join("\n");

function parseNumber(token) {
  const value = Number(token);
  if (!Number.isFinite(value)) {
    throw new Error(`Очікувалось число, отримано: ${token ?? "нічого"}`);
  }
  return value;
}

function parseId(token) {
  const value = parseNumber(token);
  if (!Number.isInteger(value)) {
    throw new Error(`id має бути цілим числом, отримано: ${token}`);
  }
  return value;
}

function requirePath(args) {
  if (args.length === 0) {
    throw new Error("Вкажіть шлях до файлу");
  }
  return args.join(" ");
}

export class Editor {
  #document;
  #commands;

  constructor(document = new Document()) {
    this.#document = document;
    this.#commands = new Map([
      ["add", (args) => this.#add(args)],
      ["move", (args) => this.#move(args)],
      ["delete", (args) => this.#delete(args)],
      ["list", () => this.#list()],
      ["save", (args) => this.#save(args)],
      ["load", (args) => this.#load(args)],
      ["export", (args) => this.#export(args)],
      ["help", () => HELP],
    ]);
  }

  get document() {
    return this.#document;
  }

  replaceDocument(data) {
    this.#document = Document.fromJSON(data);
  }

  async execute(line) {
    const [name, ...args] = line.trim().split(/\s+/);
    if (!name) {
      return "";
    }

    const command = this.#commands.get(name.toLowerCase());
    if (!command) {
      throw new Error(`Невідома команда: ${name}. Введіть help`);
    }
    return command(args);
  }

  #add([type, ...values]) {
    if (!type) {
      throw new Error("Вкажіть тип фігури: rect, circle або line");
    }
    const shape = this.#document.add(
      type.toLowerCase(),
      values.map(parseNumber),
    );
    return `Додано ${shape.describe()}`;
  }

  #move([id, dx, dy]) {
    this.#document.move(parseId(id), parseNumber(dx), parseNumber(dy));
    return `Фігуру #${id} переміщено`;
  }

  #delete([id]) {
    this.#document.remove(parseId(id));
    return `Фігуру #${id} видалено`;
  }

  #list() {
    const shapes = this.#document.list();
    if (shapes.length === 0) {
      return "Документ порожній";
    }
    return shapes.map((shape) => shape.describe()).join("\n");
  }

  async #save(args) {
    const path = requirePath(args);
    await saveDocument(this.#document, path);
    return `Збережено: ${path}`;
  }

  async #load(args) {
    const path = requirePath(args);
    this.#document = await loadDocument(path);
    return `Відкрито: ${path}`;
  }

  async #export(args) {
    const path = requirePath(args);
    await exportSvg(this.#document, path);
    return `Експортовано у SVG: ${path}`;
  }
}
