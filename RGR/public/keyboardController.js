const TOOL_BY_KEY = {
  s: "square", e: "ellipse", t: "text", l: "line", a: "arrow",
};

export class KeyboardController {
  constructor(app) {
    this.app = app;
    this.handlers = new Map([
      ["mod+z", (event) => { event.preventDefault(); event.shiftKey ? this.app.redo() : this.app.undo(); }],
      ["mod+y", (event) => { event.preventDefault(); this.app.redo(); }],
      ["mod+d", (event) => { event.preventDefault(); this.app.duplicateSelected(); }],
      ["mod+g", (event) => { event.preventDefault(); this.app.groupSelected(); }],
      ["mod+u", (event) => { event.preventDefault(); this.app.ungroupSelected(); }],
      ["mod+a", (event) => { event.preventDefault(); this.app.selectAll(); }],
      ["mod+]", (event) => { event.preventDefault(); this.app.moveLayer(1); }],
      ["mod+[", (event) => { event.preventDefault(); this.app.moveLayer(-1); }],
      ["delete", (event) => { event.preventDefault(); this.app.removeSelected(); }],
      ["escape", () => { this.app.appState.selectedId = null; this.app.appState.selectedIds = []; this.app.setTool("select"); this.app.render(); }],
      ["g", (event) => { event.preventDefault(); const enabled = this.app.interactionController.toggleSnap(); this.app.setStatus(enabled ? "Прив'язка до сітки увімкнена" : "Прив'язка до сітки вимкнена"); }],
    ]);
  }

  isTyping() {
    const el = document.activeElement;
    return Boolean(el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable));
  }

  handleKeyDown(event) {
    if (this.isTyping()) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    let id = key;
    if (mod) id = `mod+${key}`;
    if (event.key === "Delete" || event.key === "Backspace") id = "delete";
    if (event.key === "Escape") id = "escape";

    const handler = this.handlers.get(id);
    if (handler) {
      handler(event);
      return;
    }

    if (!mod && TOOL_BY_KEY[key]) {
      this.app.setTool(TOOL_BY_KEY[key]);
    }
  }

  bind() {
    document.addEventListener("keydown", (event) => this.handleKeyDown(event));
  }
}