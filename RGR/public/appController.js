import { History } from "./history.js";
import { ServerSync } from "./serverSync.js";
import { Renderer } from "./renderer.js";
import { InteractionController } from "./interactionController.js";
import { LayersPanel } from "./layersPanel.js";
import { PropertiesPanel } from "./propertiesPanel.js";
import { Ribbon } from "./ribbon.js";
import { EditorState } from "./state.js";
import { KeyboardController } from "./keyboardController.js";
import { MenuController } from "./menuController.js";

const clone = (value) => structuredClone(value);

export class AppController {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.appState = new EditorState();
    this.historyManager = new History(this.appState);
    this.serverSync = new ServerSync(this.appState, this.historyManager, (t, e) => this.setStatus(t, e), () => this.render());
    this.renderer = new Renderer(this.appState, canvas, ctx);
    this.interactionController = new InteractionController(this.appState, this.renderer, canvas, {
      commit: (n) => this.commit(n),
      render: () => this.render(),
      setTool: (n) => this.setTool(n),
      nextId: () => this.nextId(),
    });
    this.interactionController.bind();
    this.layersPanel = new LayersPanel(this.appState, { selectShape: (id) => this.selectShape(id) });
    this.propertiesPanel = new PropertiesPanel(this.appState, { updateSelected: (m) => this.updateSelected(m) });
    this.ribbon = new Ribbon({ setTool: (n) => this.setTool(n) });

    this.keyboardController = new KeyboardController(this);
    this.menuController = new MenuController(this);
  }

  setStatus(text, isError = false) {
    const status = document.getElementById("status");
    status.textContent = text;
    status.classList.toggle("error", isError);
  }

  commit(next) {
    this.historyManager.commit(next);
    this.serverSync.sync();
    this.render();
  }

  undo() { if (!this.historyManager.undo()) return; this.serverSync.sync(); this.render(); }
  redo() { if (!this.historyManager.redo()) return; this.serverSync.sync(); this.render(); }

  setTool(name) {
    this.appState.tool = name;
    document.querySelectorAll("button.tool").forEach((button) => {
      button.classList.toggle("active", button.dataset.tool === name);
    });
    this.canvas.classList.toggle("crosshair", name !== "select");
  }

  nextId() {
    return this.appState.shapes.reduce((max, s) => Math.max(max, s.id), 0) + 1;
  }

  render() {
    this.renderer.renderScene();
    this.layersPanel.render();
    this.propertiesPanel.render();
    this.updateHistoryButtons();
  }

  updateSelected(mutate) {
    const next = clone(this.appState.shapes);
    const target = next.find((s) => s.id === this.appState.selectedId);
    if (!target) return;
    mutate(target);
    this.commit(next);
  }

  selectShape(id) {
    this.appState.selectedId = id;
    this.render();
  }

  moveLayer(direction) {
    const index = this.appState.shapes.findIndex((s) => s.id === this.appState.selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= this.appState.shapes.length) return;
    const next = clone(this.appState.shapes);
    [next[index], next[target]] = [next[target], next[index]];
    this.commit(next);
  }

  selectAll() {
    this.appState.selectedIds = this.appState.shapes.map((s) => s.id);
    this.appState.selectedId = this.appState.shapes.length ? this.appState.shapes[this.appState.shapes.length - 1].id : null;
    this.render();
  }

  removeSelected() {
    if (this.appState.selectedIds.length === 0 && this.appState.selectedId === null) return;
    const ids = this.appState.selectedIds.length ? this.appState.selectedIds : [this.appState.selectedId];
    this.appState.selectedId = null;
    this.appState.selectedIds = [];
    for (const id of ids) {
      for (const key of Object.keys(this.appState.groups)) {
        this.appState.groups[key] = this.appState.groups[key].filter((x) => x !== id);
        if (this.appState.groups[key].length < 2) delete this.appState.groups[key];
      }
    }
    this.commit(this.appState.shapes.filter((s) => !ids.includes(s.id)));
  }

  duplicateSelected() {
    if (this.appState.selectedIds.length === 0 && this.appState.selectedId === null) return;
    const ids = this.appState.selectedIds.length ? this.appState.selectedIds : [this.appState.selectedId];
    const copies = [];
    for (const id of ids) {
      const original = this.appState.shapes.find((s) => s.id === id);
      if (!original) continue;
      const copy = structuredClone(original);
      copy.id = this.nextId();
      this.interactionController.moveShape(copy, 10, 10);
      copies.push(copy);
    }
    if (copies.length === 0) return;
    this.appState.selectedIds = copies.map((c) => c.id);
    this.appState.selectedId = copies[copies.length - 1].id;
    this.commit([...this.appState.shapes, ...copies]);
  }

  groupSelected() {
    if (this.appState.selectedIds.length < 2) return;
    const nextId = Object.keys(this.appState.groups).reduce((m, k) => Math.max(m, Number(k)), 0) + 1;
    this.appState.groups[nextId] = [...this.appState.selectedIds];
    this.setStatus(`Згруповано у групу #${nextId}`);
    this.commit(this.appState.shapes);
  }

  ungroupSelected() {
    if (this.appState.selectedId === null) return;
    const gid = Object.keys(this.appState.groups).find((k) => this.appState.groups[k].includes(this.appState.selectedId));
    if (!gid) return;
    delete this.appState.groups[gid];
    this.setStatus(`Групу #${gid} розформовано`);
    this.commit(this.appState.shapes);
  }

  updateHistoryButtons() {
    document.getElementById("undoBtn").disabled = !this.historyManager.canUndo();
    document.getElementById("redoBtn").disabled = !this.historyManager.canRedo();
  }

  newScene() {
    this.menuController.closeMenus();
    this.appState.shapes = [];
    this.appState.selectedId = null;
    this.appState.selectedIds = [];
    this.appState.groups = {};
    this.historyManager.reset(this.appState.shapes);
    this.serverSync.sync();
    this.render();
    this.setStatus("Створено нову сцену");
  }

  async openSelectedFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const response = await fetch("/api/document", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Не вдалося відкрити файл");
      }
      await this.serverSync.load();
      this.setStatus(`Відкрито: ${file.name}`);
    } catch (error) {
      this.setStatus(error.message, true);
    }
  }

  saveAsDownload() {
    this.menuController.closeMenus();
    const data = { shapes: this.appState.shapes, groups: this.appState.groups };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = this.fileName();
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    this.setStatus(`Збережено: ${this.fileName()}`);
  }

  fileName() {
    return document.getElementById("fileName").value.trim() || "document.json";
  }

  bindEvents() {
    document.querySelectorAll("button.tool").forEach((button) => {
      button.addEventListener("click", () => this.setTool(button.dataset.tool));
    });

    const fillOn = document.getElementById("fillOn");
    const fillColor = document.getElementById("fillColor");
    const strokeColor = document.getElementById("strokeColor");
    const strokeWidth = document.getElementById("strokeWidth");
    const strokeWidthValue = document.getElementById("strokeWidthValue");

    if (fillOn) fillOn.addEventListener("change", (event) => {
      this.updateSelected((s) => { s.style.fill = event.target.checked ? fillColor.value : "none"; });
    });
    if (fillColor) fillColor.addEventListener("change", (event) => {
      this.updateSelected((s) => { s.style.fill = event.target.value; });
    });
    if (strokeColor) strokeColor.addEventListener("change", (event) => {
      this.updateSelected((s) => { s.style.stroke = event.target.value; });
    });
    if (strokeWidth) {
      strokeWidth.addEventListener("input", (event) => {
        strokeWidthValue.textContent = `${event.target.value} px`;
      });
      strokeWidth.addEventListener("change", (event) => {
        const value = Number(event.target.value);
        this.updateSelected((s) => { s.style.strokeWidth = value; });
      });
    }

    const undoBtn = document.getElementById("undoBtn");
    const redoBtn = document.getElementById("redoBtn");
    const layerUp = document.getElementById("layerUp");
    const layerDown = document.getElementById("layerDown");
    const deleteBtn = document.getElementById("deleteBtn");
    if (undoBtn) undoBtn.addEventListener("click", () => this.undo());
    if (redoBtn) redoBtn.addEventListener("click", () => this.redo());
    if (layerUp) layerUp.addEventListener("click", () => this.moveLayer(1));
    if (layerDown) layerDown.addEventListener("click", () => this.moveLayer(-1));
    if (deleteBtn) deleteBtn.addEventListener("click", () => this.removeSelected());

    this.menuController.bind();
    this.keyboardController.bind();
  }

  start() {
    this.ribbon.render();
    this.setTool("select");
    this.serverSync.load().catch(() => this.setStatus("Не вдалося завантажити документ із сервера", true));
  }
}