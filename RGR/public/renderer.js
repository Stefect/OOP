const CANVAS = { width: 2000, height: 2000 };
const GRID = 20;
const HANDLE = 8;
const HIT = 6;
const BOX_TYPES = new Set(["rectangle","square","rhombus","diamond","cube","cylinder","triangle","roundedrect","roundedrectangle","star","callout","speechbubble","flowdecision","flowprocess","flowterminator","cuboid","pyramid","cone","sphere","parallelogram","text","label","polygon","polyline","bezier","arrowbox"]);

export class Renderer {
  constructor(state, canvas, ctx) {
    this.state = state;
    this.canvas = canvas;
    this.ctx = ctx;
  }

  current() {
    return this.state.draft ?? this.state.shapes;
  }

  selectedShape() {
    const current = this.current();
    return current.find((s) => s.id === this.state.selectedId) ?? null;
  }

  renderScene() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
    this.drawGrid();
    for (const shape of this.current()) {
      this.drawShape(shape);
    }
    if (this.state.preview) {
      this.drawShape(this.state.preview);
    }
    const selected = this.state.preview ? null : this.selectedShape();
    if (selected) {
      this.drawSelection(selected);
    }
  }

  drawGrid() {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "#eef0f4";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = GRID; x < CANVAS.width; x += GRID) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, CANVAS.height);
    }
    for (let y = GRID; y < CANVAS.height; y += GRID) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(CANVAS.width, y + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }

  shadeColor(color, factor) {
    if (!color || color === "none") color = "#888";
    let c = String(color).trim();
    if (c.startsWith("#")) {
      c = c.slice(1);
      if (c.length === 3) c = c.split("").map((x) => x + x).join("");
      const num = parseInt(c, 16);
      let r = (num >> 16) & 255;
      let g = (num >> 8) & 255;
      let b = num & 255;
      r = Math.min(255, Math.max(0, Math.round(r * factor)));
      g = Math.min(255, Math.max(0, Math.round(g * factor)));
      b = Math.min(255, Math.max(0, Math.round(b * factor)));
      return `rgb(${r}, ${g}, ${b})`;
    }
    return color;
  }

  drawSolidShape(type, g, style) {
    const ctx = this.ctx;
    const x = g.x || 0;
    const y = g.y || 0;
    const w = g.width || 0;
    const h = g.height || 0;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const base = style.fill !== "none" ? style.fill : "#cfe2ff";
    const light = this.shadeColor(base, 1.25);
    const dark = this.shadeColor(base, 0.7);
    const darker = this.shadeColor(base, 0.5);

    if (type === "cube" || type === "cuboid") {
      const d = Math.min(w, h) * 0.28;
      ctx.beginPath();
      ctx.moveTo(x, y + d);
      ctx.lineTo(x + d, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - d, y + d);
      ctx.closePath();
      ctx.fillStyle = light;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w - d, y + d);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h - d);
      ctx.lineTo(x + w - d, y + h);
      ctx.closePath();
      ctx.fillStyle = dark;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(x, y + d, w - d, h - d);
      ctx.fillStyle = base;
      ctx.fill();
      ctx.stroke();
    } else if (type === "cylinder") {
      const rx = w / 2;
      const ry = Math.max(4, h * 0.16);
      ctx.beginPath();
      ctx.rect(x, y + ry, w, h - 2 * ry);
      const grad = ctx.createLinearGradient(x, 0, x + w, 0);
      grad.addColorStop(0, dark);
      grad.addColorStop(0.5, base);
      grad.addColorStop(1, dark);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, y + h - ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = darker;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, y + ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = light;
      ctx.fill();
      ctx.stroke();
    } else if (type === "cone") {
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(cx, y, cx, y + h);
      grad.addColorStop(0, light);
      grad.addColorStop(1, dark);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, y + h, w / 2, Math.max(4, h * 0.12), 0, 0, Math.PI * 2);
      ctx.fillStyle = darker;
      ctx.fill();
      ctx.stroke();
    } else if (type === "pyramid") {
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x, y + h);
      ctx.lineTo(cx, y + h * 0.6);
      ctx.closePath();
      ctx.fillStyle = dark;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(cx, y + h * 0.6);
      ctx.closePath();
      ctx.fillStyle = base;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(cx, y + h * 0.6);
      ctx.closePath();
      ctx.fillStyle = darker;
      ctx.fill();
      ctx.stroke();
    } else if (type === "sphere") {
      ctx.beginPath();
      ctx.arc(cx, cy, Math.min(w, h) / 2, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx - w * 0.2, cy - h * 0.2, 2, cx, cy, Math.min(w, h) / 2);
      grad.addColorStop(0, light);
      grad.addColorStop(1, dark);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.min(w, h) / 2, Math.min(w, h) / 8, 0, 0, Math.PI * 2);
      ctx.strokeStyle = this.shadeColor(base, 0.85);
      ctx.stroke();
    }
  }

  drawVectorShape(type, g) {
    const ctx = this.ctx;
    const x = g.x || 0;
    const y = g.y || 0;
    const w = g.width || 0;
    const h = g.height || 0;
    const cx = (typeof g.cx === "number") ? g.cx : x + w / 2;
    const cy = (typeof g.cy === "number") ? g.cy : y + h / 2;
    ctx.beginPath();
    if (type === "rectangle" || type === "square" || type === "flowprocess" || type === "cuboid") {
      ctx.rect(x, y, w, h);
    } else if (type === "roundedrect" || type === "roundedrectangle" || type === "flowterminator" || type === "callout" || type === "speechbubble") {
      const r = Math.min(w, h) / 5;
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    } else if (type === "circle" || type === "sphere") {
      ctx.arc(cx, cy, (typeof g.r === "number" ? g.r : Math.min(w, h) / 2), 0, Math.PI * 2);
    } else if (type === "ellipse") {
      ctx.ellipse(cx, cy, Math.max(1, g.rx || w / 2), Math.max(1, g.ry || h / 2), 0, 0, Math.PI * 2);
    } else if (type === "triangle" || type === "pyramid" || type === "cone") {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    } else if (type === "rhombus" || type === "diamond" || type === "flowdecision") {
      ctx.moveTo(cx, y);
      ctx.lineTo(x + w, cy);
      ctx.lineTo(cx, y + h);
      ctx.lineTo(x, cy);
      ctx.closePath();
    } else if (type === "parallelogram") {
      const skew = w * 0.2;
      ctx.moveTo(x + skew, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w - skew, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
    } else if (type === "polygon") {
      const sides = 6;
      const r = Math.min(w, h) / 2;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    } else if (type === "polyline") {
      ctx.moveTo(x, y + h);
      ctx.lineTo(x + w * 0.33, y);
      ctx.lineTo(x + w * 0.66, y + h);
      ctx.lineTo(x + w, y);
    } else if (type === "bezier") {
      ctx.moveTo(x, cy);
      ctx.bezierCurveTo(x + w * 0.33, y, x + w * 0.66, y + h, x + w, cy);
    } else if (type === "star") {
      const spikes = 5;
      const outer = Math.min(w, h) / 2;
      const inner = outer / 2;
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;
      ctx.moveTo(cx, cy - outer);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outer, cy + Math.sin(rot) * outer);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * inner, cy + Math.sin(rot) * inner);
        rot += step;
      }
      ctx.closePath();
    } else if (type === "arrow") {
      ctx.moveTo(g.x1, g.y1);
      ctx.lineTo(g.x2, g.y2);
      const angle = Math.atan2(g.y2 - g.y1, g.x2 - g.x1);
      const len = 12;
      ctx.moveTo(g.x2, g.y2);
      ctx.lineTo(g.x2 - len * Math.cos(angle - Math.PI / 6), g.y2 - len * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(g.x2, g.y2);
      ctx.lineTo(g.x2 - len * Math.cos(angle + Math.PI / 6), g.y2 - len * Math.sin(angle + Math.PI / 6));
    } else if (type === "line") {
      ctx.moveTo(g.x1, g.y1);
      ctx.lineTo(g.x2, g.y2);
    } else if (type === "arc" || type === "sector") {
      ctx.arc(cx, cy, (typeof g.r === "number" ? g.r : Math.min(w, h) / 2), g.start || 0, g.end || Math.PI * 2);
      if (type === "sector") {
        ctx.lineTo(cx, cy);
        ctx.closePath();
      }
    } else if (type === "text" || type === "label") {
      ctx.rect(x, y, w, h);
    } else {
      ctx.rect(x, y, w, h);
    }
  }

  drawShape(shape) {
    const ctx = this.ctx;
    const g = shape.geometry || {};
    ctx.save();
    ctx.lineWidth = shape.style.strokeWidth;
    ctx.strokeStyle = shape.style.stroke;
    ctx.fillStyle = shape.style.fill;
    const solid = new Set(["cube", "cuboid", "cylinder", "cone", "pyramid", "sphere"]);
    if (solid.has(shape.type)) {
      this.drawSolidShape(shape.type, g, shape.style);
      ctx.restore();
      return;
    }
    this.drawVectorShape(shape.type, g);
    const noFill = new Set(["line", "arrow", "polyline", "bezier", "arc"]);
    if (shape.style.fill !== "none" && !noFill.has(shape.type)) {
      ctx.fill();
    }
    ctx.stroke();
    if (shape.type === "text" || shape.type === "label") {
      ctx.fillStyle = shape.style.stroke;
      ctx.font = "16px sans-serif";
      ctx.fillText(g.text || "Текст", g.x + 6, g.y + 20);
    }
    ctx.restore();
  }

  drawSelection(shape) {
    const ctx = this.ctx;
    const b = this.boundsOf(shape);
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = "#3c5bd6";
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
    ctx.setLineDash([]);
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "#3c5bd6";
    for (const h of this.handlesOf(shape)) {
      ctx.beginPath();
      ctx.rect(h.x - HANDLE / 2, h.y - HANDLE / 2, HANDLE, HANDLE);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  boundsOf(shape) {
    const g = shape.geometry;
    if (shape.type === "rectangle") {
      return { x: g.x, y: g.y, width: g.width, height: g.height };
    }
    if (shape.type === "circle") {
      return { x: g.cx - g.r, y: g.cy - g.r, width: g.r * 2, height: g.r * 2 };
    }
    if (shape.type === "ellipse") {
      return { x: g.cx - g.rx, y: g.cy - g.ry, width: g.rx * 2, height: g.ry * 2 };
    }
    if (BOX_TYPES.has(shape.type)) {
      return { x: g.x, y: g.y, width: g.width, height: g.height };
    }
    if (shape.type === "arc") {
      return { x: g.cx - g.r, y: g.cy - g.r, width: g.r * 2, height: g.r * 2 };
    }
    const x = Math.min(g.x1, g.x2);
    const y = Math.min(g.y1, g.y2);
    return { x, y, width: Math.abs(g.x2 - g.x1), height: Math.abs(g.y2 - g.y1) };
  }

  handlesOf(shape) {
    const g = shape.geometry;
    if (shape.type === "rectangle") {
      const { x, y, width: w, height: h } = g;
      return [
        { name: "nw", x, y }, { name: "n", x: x + w / 2, y },
        { name: "ne", x: x + w, y }, { name: "e", x: x + w, y: y + h / 2 },
        { name: "se", x: x + w, y: y + h }, { name: "s", x: x + w / 2, y: y + h },
        { name: "sw", x, y: y + h }, { name: "w", x, y: y + h / 2 },
      ];
    }
    if (shape.type === "circle") {
      return [{ name: "r", x: g.cx + g.r, y: g.cy }];
    }
    if (shape.type === "ellipse") {
      return [
        { name: "e", x: g.cx + g.rx, y: g.cy },
        { name: "w", x: g.cx - g.rx, y: g.cy },
        { name: "n", x: g.cx, y: g.cy - g.ry },
        { name: "s", x: g.cx, y: g.cy + g.ry },
      ];
    }
    if (BOX_TYPES.has(shape.type)) {
      const { x, y, width: w, height: h } = g;
      return [
        { name: "nw", x, y }, { name: "n", x: x + w / 2, y },
        { name: "ne", x: x + w, y }, { name: "e", x: x + w, y: y + h / 2 },
        { name: "se", x: x + w, y: y + h }, { name: "s", x: x + w / 2, y: y + h },
        { name: "sw", x, y: y + h }, { name: "w", x, y: y + h / 2 },
      ];
    }
    if (shape.type === "arc") {
      return [{ name: "r", x: g.cx + g.r, y: g.cy }];
    }
    return [{ name: "p1", x: g.x1, y: g.y1 }, { name: "p2", x: g.x2, y: g.y2 }];
  }
}