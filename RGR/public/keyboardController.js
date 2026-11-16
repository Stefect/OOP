const TOOL_BY_KEY = {
  v: "select", s: "square", e: "ellipse", t: "text", l: "line", a: "arrow",
};

export class KeyboardController {
  constructor(app) {
    this.app = app;
  }

  isTyping() {
    const el = document.activeElement;
    return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable));
  }

  handleKeyDown(event) {
    if (this.isTyping()) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    if (mod && key === "z") {
      event.preventDefault();
      event.shiftKey ? this.app.redo() : this.app.undo();
    } else if (mod && key === "y") {
      event.preventDefault();
      this.app.redo();
    } else if (mod && key === "d") {
      event.preventDefault();
      this.app.duplicateSelected();
    } else if (mod && key === "g") {
      event.preventDefault();
      this.app.groupSelected();
    } else if (mod && key === "u") {
      event.preventDefault();
      this.app.ungroupSelected();
    } else if (mod && key === "a") {
      event.preventDefault();
      this.app.selectAll();
    } else if (mod && (event.key === "]" || event.key === "}")) {
      event.preventDefault();
      this.app.moveLayer(1);
    } else if (mod && (event.key === "[" || event.key === "{")) {
      event.preventDefault();
      this.app.moveLayer(-1);
    } else if (!mod && (event.key === "Delete" || event.key === "Backspace")) {
      event.preventDefault();
      this.app.removeSelected();
    } else if (event.key === "Escape") {
      this.app.appState.selectedId = null;
      this.app.appState.selectedIds = [];
      this.app.setTool("select");
      this.app.render();
    } else if (!mod && key === "g") {
      event.preventDefault();
      const enabled = this.app.interactionController.toggleSnap();
      this.app.setStatus(enabled ? "Прив'язка до сітки увімкнена" : "Прив'язка до сітки вимкнена");
    } else if (!mod && TOOL_BY_KEY[key]) {
      this.app.setTool(TOOL_BY_KEY[key]);
    }
  }

  bind() {
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
  }
}