const HANDLE = 8;
const HIT = 6;
const DEFAULT_STYLE = { stroke: "#2b5797", fill: "#cfe2ff", strokeWidth: 2 };
const BOX_TYPES = new Set(["rectangle","square","rhombus","diamond","cube","cylinder","triangle","roundedrect","roundedrectangle","star","callout","speechbubble","flowdecision","flowprocess","flowterminator","cuboid","pyramid","cone","sphere","parallelogram","text","label","polygon","polyline","bezier","arrowbox"]);

export class InteractionController {
  constructor(state, renderer, canvas, callbacks) {
    this.state = state;
    this.renderer = renderer;
    this.canvas = canvas;
    this.commit = callbacks.commit;
    this.render = callbacks.render;
    this.setTool = callbacks.setTool;
    this.nextId = callbacks.nextId;
    this.snapEnabled = false;
  }

  toggleSnap() {
    this.snapEnabled = !this.snapEnabled;
    return this.snapEnabled;
  }

  snap(value) {
    return this.snapEnabled ? Math.round(value / 20) * 20 : value;
  }

  groupMembers(id) {
    const groups = this.state.groups || {};
    for (const members of Object.values(groups)) {
      if (members.includes(id)) return [...members];
    }
    return [id];
  }

  canvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) * 2000) / rect.width),
      y: Math.round(((event.clientY - rect.top) * 2000) / rect.height),
    };
  }

  distanceToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lengthSq = dx * dx + dy * dy;
    let t = lengthSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  hitShape(shape, x, y) {
    const g = shape.geometry;
    if (shape.type === "rectangle") {
      return x >= g.x && x <= g.x + g.width && y >= g.y && y <= g.y + g.height;
    }
    if (shape.type === "circle") {
      return Math.hypot(x - g.cx, y - g.cy) <= g.r;
    }
    if (shape.type === "ellipse") {
      const rx = Math.max(1, g.rx);
      const ry = Math.max(1, g.ry);
      const nx = (x - g.cx) / rx;
      const ny = (y - g.cy) / ry;
      return nx * nx + ny * ny <= 1;
    }
    if (BOX_TYPES.has(shape.type)) {
      return x >= g.x && x <= g.x + g.width && y >= g.y && y <= g.y + g.height;
    }
    if (shape.type === "arc") {
      return Math.hypot(x - g.cx, y - g.cy) <= g.r;
    }
    return this.distanceToSegment(x, y, g.x1, g.y1, g.x2, g.y2) <= HIT;
  }

  hitHandle(shape, x, y) {
    return this.renderer.handlesOf(shape).find((h) => Math.abs(h.x - x) <= HANDLE && Math.abs(h.y - y) <= HANDLE) ?? null;
  }

  resizeShape(shape, handle, x, y) {
    const g = shape.geometry;
    if (shape.type === "rectangle") {
      let left = g.x;
      let right = g.x + g.width;
      let top = g.y;
      let bottom = g.y + g.height;
      if (handle.includes("w")) left = Math.min(x, right - 1);
      if (handle.includes("e")) right = Math.max(x, left + 1);
      if (handle.includes("n")) top = Math.min(y, bottom - 1);
      if (handle.includes("s")) bottom = Math.max(y, top + 1);
      Object.assign(g, { x: left, y: top, width: right - left, height: bottom - top });
    } else if (shape.type === "circle") {
      g.r = Math.max(1, Math.round(Math.hypot(x - g.cx, y - g.cy)));
    } else if (shape.type === "ellipse") {
      if (handle === "e" || handle === "w") g.rx = Math.max(1, Math.abs(x - g.cx));
      if (handle === "n" || handle === "s") g.ry = Math.max(1, Math.abs(y - g.cy));
    } else if (BOX_TYPES.has(shape.type)) {
      let left = g.x;
      let right = g.x + g.width;
      let top = g.y;
      let bottom = g.y + g.height;
      if (handle.includes("w")) left = Math.min(x, right - 1);
      if (handle.includes("e")) right = Math.max(x, left + 1);
      if (handle.includes("n")) top = Math.min(y, bottom - 1);
      if (handle.includes("s")) bottom = Math.max(y, top + 1);
      Object.assign(g, { x: left, y: top, width: right - left, height: bottom - top });
    } else if (shape.type === "arc") {
      g.r = Math.max(1, Math.round(Math.hypot(x - g.cx, y - g.cy)));
    } else if (handle === "p1") {
      Object.assign(g, { x1: x, y1: y });
    } else {
      Object.assign(g, { x2: x, y2: y });
    }
    if (this.snapEnabled) {
      for (const key of Object.keys(g)) {
        if (typeof g[key] === "number") g[key] = this.snap(g[key]);
      }
    }
  }

  moveShape(shape, dx, dy) {
    const g = shape.geometry;
    if (shape.type === "rectangle") {
      g.x += dx;
      g.y += dy;
    } else if (shape.type === "circle") {
      g.cx += dx;
      g.cy += dy;
    } else if (shape.type === "ellipse") {
      g.cx += dx;
      g.cy += dy;
    } else if (BOX_TYPES.has(shape.type)) {
      g.x += dx;
      g.y += dy;
    } else if (shape.type === "arc") {
      g.cx += dx;
      g.cy += dy;
    } else {
      g.x1 += dx;
      g.y1 += dy;
      g.x2 += dx;
      g.y2 += dy;
    }
    if (this.snapEnabled) {
      for (const key of Object.keys(g)) {
        if (typeof g[key] === "number") g[key] = this.snap(g[key]);
      }
    }
  }

  geometryFromDrag(type, a, b) {
    if (this.snapEnabled) {
      a = { x: this.snap(a.x), y: this.snap(a.y) };
      b = { x: this.snap(b.x), y: this.snap(b.y) };
    }
    if (type === "rectangle") {
      return {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        width: Math.abs(b.x - a.x),
        height: Math.abs(b.y - a.y),
      };
    }
    if (type === "circle") {
      return { cx: a.x, cy: a.y, r: Math.round(Math.hypot(b.x - a.x, b.y - a.y)) };
    }
    if (type === "ellipse") {
      return { cx: a.x, cy: a.y, rx: Math.abs(b.x - a.x), ry: Math.abs(b.y - a.y) };
    }
    if (type === "arc") {
      return { cx: a.x, cy: a.y, r: Math.round(Math.hypot(b.x - a.x, b.y - a.y)), start: 0, end: 6.28 };
    }
    if (BOX_TYPES.has(type)) {
      return {
        x: Math.min(a.x, b.x),
        y: Math.min(a.y, b.y),
        width: Math.abs(b.x - a.x),
        height: Math.abs(b.y - a.y),
      };
    }
    return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  }

  isLargeEnough(type, g) {
    if (type === "rectangle") return g.width >= 2 && g.height >= 2;
    if (type === "circle") return g.r >= 2;
    if (type === "ellipse") return g.rx >= 2 && g.ry >= 2;
    if (type === "arc") return g.r >= 2;
    if (BOX_TYPES.has(type)) return g.width >= 2 && g.height >= 2;
    return Math.hypot(g.x2 - g.x1, g.y2 - g.y1) >= 2;
  }

  startInteraction(next) {
    this.state.draft = structuredClone(this.state.shapes);
    this.state.interaction = next;
  }

  bind() {
    this.canvas.addEventListener("mousedown", (event) => this.handleMouseDown(event));
    this.canvas.addEventListener("mousemove", (event) => this.handleMouseMove(event));
    this.canvas.addEventListener("mouseup", () => this.finishInteraction());
    this.canvas.addEventListener("mouseleave", () => this.finishInteraction());
  }

  handleMouseDown(event) {
    if (event.button !== 0) return;
    const point = this.canvasPoint(event);

    if (this.state.tool !== "select") {
      this.state.interaction = { mode: "create", start: point, end: point };
      this.state.preview = null;
      return;
    }

    const selected = this.renderer.selectedShape();
    if (selected) {
      const handle = this.hitHandle(selected, point.x, point.y);
      if (handle) {
        this.startInteraction({ mode: "resize", handle: handle.name, last: point });
        return;
      }
    }

    const hit = [...this.state.shapes].reverse().find((s) => this.hitShape(s, point.x, point.y));
    if (event.shiftKey && hit) {
      const idx = this.state.selectedIds.indexOf(hit.id);
      if (idx >= 0) {
        this.state.selectedIds.splice(idx, 1);
      } else {
        this.state.selectedIds.push(hit.id);
      }
      this.state.selectedId = hit.id;
    } else if (hit) {
      const members = this.groupMembers(hit.id);
      this.state.selectedIds = members.length > 1 ? members : [hit.id];
      this.state.selectedId = hit.id;
    } else {
      this.state.selectedIds = [];
      this.state.selectedId = null;
    }
    if (hit) {
      this.startInteraction({ mode: "move", last: point, moved: false });
    }
    this.render();
  }

  handleMouseMove(event) {
    if (!this.state.interaction) return;
    const point = this.canvasPoint(event);

    if (this.state.interaction.mode === "create") {
      this.state.interaction.end = point;
      const geometry = this.geometryFromDrag(this.state.tool, this.state.interaction.start, point);
      this.state.preview = { id: 0, type: this.state.tool, geometry, style: { ...DEFAULT_STYLE } };
      this.render();
      return;
    }

    const shape = this.state.draft?.find((s) => s.id === this.state.selectedId);
    if (!shape) return;

    if (this.state.interaction.mode === "resize") {
      this.resizeShape(shape, this.state.interaction.handle, point.x, point.y);
    } else {
      const dx = point.x - this.state.interaction.last.x;
      const dy = point.y - this.state.interaction.last.y;
      if (dx === 0 && dy === 0) return;
      const group = this.groupMembers(shape.id);
      const toMove = group.length > 1 ? group : this.state.selectedIds;
      if (toMove.length > 1) {
        for (const id of toMove) {
          const s = this.state.draft.find((x) => x.id === id);
          if (s) this.moveShape(s, dx, dy);
        }
      } else {
        this.moveShape(shape, dx, dy);
      }
      this.state.interaction.moved = true;
    }
    this.state.interaction.last = point;
    this.render();
  }

  finishInteraction() {
    if (!this.state.interaction) return;
    const finished = this.state.interaction;
    this.state.interaction = null;

    if (finished.mode === "create") {
      const geometry = this.state.preview?.geometry;
      this.state.preview = null;
      if (geometry && this.isLargeEnough(this.state.tool, geometry)) {
        const id = this.nextId();
        const shape = { id, type: this.state.tool, geometry, style: { ...DEFAULT_STYLE } };
        this.state.selectedId = id;
        this.setTool("select");
        this.commit([...this.state.shapes, shape]);
      } else {
        this.render();
      }
      return;
    }

    const next = this.state.draft;
    this.state.draft = null;
    if (JSON.stringify(next) !== JSON.stringify(this.state.shapes)) {
      this.commit(next);
    } else {
      this.render();
    }
  }
}