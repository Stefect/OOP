export class ServerSync {
  constructor(state, historyManager, setStatus, render) {
    this.state = state;
    this.historyManager = historyManager;
    this.setStatus = setStatus;
    this.render = render;
    this.syncChain = Promise.resolve();
  }

  sync() {
    this.syncChain = this.syncChain.then(async () => {
      const response = await fetch("/api/document", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shapes: this.state.shapes }),
      });
      if (!response.ok) {
        const data = await response.json();
        this.setStatus(data.error, true);
      }
    });
    return this.syncChain;
  }

  async load() {
    const response = await fetch("/api/document");
    const data = await response.json();
    this.state.shapes = data.shapes;
    this.state.selectedId = null;
    this.historyManager.reset(this.state.shapes);
    this.render();
  }

  async fileOperation(line) {
    await this.syncChain;
    const response = await fetch("/api/command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ line }),
    });
    const data = await response.json();
    if (!response.ok) {
      this.setStatus(data.error, true);
      return false;
    }
    this.setStatus(data.message);
    return true;
  }
}