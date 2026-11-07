import { MAX_HISTORY } from "./state.js";

export class History {
  constructor(state) {
    this.state = state;
  }

  commit(next) {
    this.state.shapes = next;
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    this.state.history.push({
      shapes: structuredClone(next),
      groups: structuredClone(this.state.groups ?? {}),
    });
    if (this.state.history.length > MAX_HISTORY) {
      this.state.history.shift();
    }
    this.state.historyIndex = this.state.history.length - 1;
  }

  undo() {
    if (this.state.historyIndex <= 0) return false;
    this.state.historyIndex--;
    const entry = this.state.history[this.state.historyIndex];
    this.state.shapes = structuredClone(entry.shapes);
    this.state.groups = structuredClone(entry.groups ?? {});
    return true;
  }

  redo() {
    if (this.state.historyIndex >= this.state.history.length - 1) return false;
    this.state.historyIndex++;
    const entry = this.state.history[this.state.historyIndex];
    this.state.shapes = structuredClone(entry.shapes);
    this.state.groups = structuredClone(entry.groups ?? {});
    return true;
  }

  canUndo() {
    return this.state.historyIndex > 0;
  }

  canRedo() {
    return this.state.historyIndex < this.state.history.length - 1;
  }

  reset(shapes = this.state.shapes, groups = this.state.groups) {
    this.state.shapes = shapes;
    this.state.groups = groups ?? {};
    this.state.history = [{
      shapes: structuredClone(shapes),
      groups: structuredClone(this.state.groups),
    }];
    this.state.historyIndex = 0;
  }
}