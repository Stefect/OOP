import { Document } from "./Document.js";
import { documentStorage } from "./Storage.js";

const HELP = [
  "Команди:",
  "  add rect x y width height       - додати прямокутник",
  "  add circle cx cy r              - додати коло",
  "  add line x1 y1 x2 y2            - додати лінію",
  "  move id dx dy                   - перемістити фігуру",
  "  duplicate id                    - дублювати фігуру",
  "  group id1 id2 ...              - згрупувати фігури",
  "  ungroup groupId                 - розгрупувати",
  "  delete id                       - видалити фігуру",
  "  list                            - показати всі фігури",
  "  save файл.json                  - зберегти документ",
  "  load файл.json                  - відкрити документ",
  "  export файл.svg                 - експортувати у SVG",
  "  help                            - показати довідку",
  "  exit                            - вийти",
].join("\n");

export class Editor {
  #document;
  #commands;

  constructor(document = new Document()) {
    this.#document = document;
    this.#commands = new Map([
      ["add", (args) => this.#add(args)],
      ["move", (args) => this.#move(args)],
      ["duplicate", (args) => this.#duplicate(args)],
      ["group", (args) => this.#group(args)],
      ["ungroup", (args) => this.#ungroup(args)],
      ["delete", (args) => this.#delete(args)],
      ["list", () => this.#list()],
      ["save", (args) => this.#save(args)],
      ["load", (args) => this.#load(args)],
      ["export", (args) => this.#export(args)],
      ["help", () => HELP],
    ]);
  }

  documentToJSON() {
    return this.#document.toJSON();
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

  #parseNumber(token) {
    const value = Number(token);
    if (!Number.isFinite(value)) {
      throw new Error(`Очікувалось число, отримано: ${token ?? "нічого"}`);
    }
    return value;
  }

  #parseId(token) {
    const value = this.#parseNumber(token);
    if (!Number.isInteger(value)) {
      throw new Error(`id має бути цілим числом, отримано: ${token}`);
    }
    return value;
  }

  #requirePath(args) {
    if (args.length === 0) {
      throw new Error("Вкажіть шлях до файлу");
    }
    return args.join(" ");
  }

  #add([type, ...values]) {
    if (!type) {
      throw new Error("Вкажіть тип фігури: rect, circle або line");
    }
    const shape = this.#document.add(
      type.toLowerCase(),
      values.map((token) => this.#parseNumber(token)),
    );
    return `Додано ${shape.describe()}`;
  }

  #move([id, dx, dy]) {
    this.#document.move(this.#parseId(id), this.#parseNumber(dx), this.#parseNumber(dy));
    return `Фігуру #${id} переміщено`;
  }

  #delete([id]) {
    this.#document.remove(this.#parseId(id));
    return `Фігуру #${id} видалено`;
  }

  #duplicate([id]) {
    const shape = this.#document.duplicate(this.#parseId(id));
    return `Дубльовано #${id} як #${shape.id}`;
  }

  #group(args) {
    const ids = args.map((token) => this.#parseId(token));
    const groupId = this.#document.group(ids);
    return `Згруповано у групу #${groupId}`;
  }

  #ungroup([id]) {
    this.#document.ungroup(this.#parseId(id));
    return `Групу #${id} розформовано`;
  }

  #list() {
    const shapes = this.#document.list();
    if (shapes.length === 0) {
      return "Документ порожній";
    }
    return shapes.map((shape) => shape.describe()).join("\n");
  }

  async #save(args) {
    const path = this.#requirePath(args);
    await documentStorage.save(this.#document, path);
    return `Збережено: ${path}`;
  }

  async #load(args) {
    const path = this.#requirePath(args);
    this.#document = await documentStorage.load(path);
    return `Відкрито: ${path}`;
  }

  async #export(args) {
    const path = this.#requirePath(args);
    await documentStorage.exportSvg(this.#document, path);
    return `Експортовано у SVG: ${path}`;
  }
}