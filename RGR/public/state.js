export const MAX_HISTORY = 100;

export class EditorState {
  constructor() {
    this.shapes = [];
    this.draft = null;
    this.preview = null;
    this.selectedId = null;
    this.tool = "select";
    this.interaction = null;
    this.history = [];
    this.historyIndex = -1;
  }

  current() {
    return this.draft ?? this.shapes;
  }

  resetHistory(initial = []) {
    this.history = [structuredClone(initial)];
    this.historyIndex = 0;
  }
}