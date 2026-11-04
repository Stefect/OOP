import { MAX_HISTORY } from "./state.js";

export class History {
  constructor(state) {
    this.state = state;
  }

  commit(next) {
    this.state.shapes = next;
    this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
    this.state.history.push(structuredClone(next));
    if (this.state.history.length > MAX_HISTORY) {
      this.state.history.shift();
    }
    this.state.historyIndex = this.state.history.length - 1;
  }

  undo() {
    if (this.state.historyIndex <= 0) return false;
    this.state.historyIndex--;
    this.state.shapes = structuredClone(this.state.history[this.state.historyIndex]);
    return true;
  }

  redo() {
    if (this.state.historyIndex >= this.state.history.length - 1) return false;
    this.state.historyIndex++;
    this.state.shapes = structuredClone(this.state.history[this.state.historyIndex]);
    return true;
  }

  canUndo() {
    return this.state.historyIndex > 0;
  }

  canRedo() {
    return this.state.historyIndex < this.state.history.length - 1;
  }

  reset(initial = []) {
    this.state.history = [structuredClone(initial)];
    this.state.historyIndex = 0;
  }
}