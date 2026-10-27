const CANVAS = { width: 2000, height: 2000 };
const GRID = 20;
const HANDLE = 8;
const HIT = 6;
const MAX_HISTORY = 100;

const BOX_TYPES = new Set(["rectangle","square","rhombus","diamond","cube","cylinder","triangle","roundedrect","roundedrectangle","star","callout","speechbubble","flowdecision","flowprocess","flowterminator","cuboid","pyramid","cone","sphere","parallelogram","text","label","polygon","polyline","bezier","arrowbox"]);
const TYPE_LABELS = {
  rectangle: "Прямокутник", square: "Квадрат", circle: "Коло", ellipse: "Еліпс", rhombus: "Ромб", diamond: "Ромб", cube: "Куб", cylinder: "Циліндр",
  triangle: "Трикутник", roundedrect: "Скруглений прямокутник", star: "Зірка", callout: "Виноска", speechbubble: "Хмаринка",
  flowdecision: "Рішення", flowprocess: "Процес", flowterminator: "Термінатор", cuboid: "Паралелепіпед", pyramid: "Піраміда", cone: "Конус", sphere: "Сфера",
  parallelogram: "Паралелограм", text: "Текст", polygon: "Багатокутник", polyline: "Ломана", bezier: "Крива Безьє", arc: "Дуга/Сектор", line: "Лінія", arrow: "Стрілка",
  group: "Група"
};
const TYPE_GLYPHS = {
  rectangle: "R", square: "S", circle: "O", ellipse: "O", rhombus: "D", diamond: "D", cube: "C", cylinder: "Y",
  triangle: "T", roundedrect: "U", star: "*", callout: "!", speechbubble: "!", flowdecision: "?", flowprocess: "P",
  flowterminator: "O", cuboid: "B", pyramid: "A", cone: "V", sphere: "●", parallelogram: "P", text: "T",
  polygon: "G", polyline: "/", bezier: "~", arc: ")", line: "/", arrow: "->", group: "G",
};
const TOOL_BY_KEY = { v: "select", r: "rectangle", c: "circle", e: "ellipse", l: "line", a: "arrow", t: "text" };
const GEOMETRY_FIELDS = {
  circle: [["cx", "X центру"], ["cy", "Y центру"], ["r", "Радіус"]],
  ellipse: [["cx", "X центру"], ["cy", "Y центру"], ["rx", "Радіус X"], ["ry", "Радіус Y"]],
  line: [["x1", "X1"], ["y1", "Y1"], ["x2", "X2"], ["y2", "Y2"]],
  arrow: [["x1", "X1"], ["y1", "Y1"], ["x2", "X2"], ["y2", "Y2"]],
  arc: [["cx", "X центру"], ["cy", "Y центру"], ["r", "Радіус"], ["start", "Початок"], ["end", "Кінець"]],
};
for (const type of BOX_TYPES) {
  GEOMETRY_FIELDS[type] = [["x", "X"], ["y", "Y"], ["width", "Ширина"], ["height", "Висота"]];
}
const MIN_SIZE_FIELDS = new Set(["width", "height", "r", "rx", "ry"]);
const DEFAULT_STYLE = { stroke: "#2b5797", fill: "#cfe2ff", strokeWidth: 2 };

const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d");
const DPR = window.devicePixelRatio || 1;
canvas.width = CANVAS.width * DPR;
canvas.height = CANVAS.height * DPR;
canvas.style.width = `${CANVAS.width}px`;
canvas.style.height = `${CANVAS.height}px`;
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

const clone = (value) => structuredClone(value);

let shapes = [];        // зафіксований стан документа
let draft = null;       // копія, що змінюється під час перетягування
let preview = null;     // фігура, яка малюється інструментом
let selectedId = null;
let tool = "select";
let interaction = null; // поточна дія мишкою
let history = [];
let historyIndex = -1;
let syncChain = Promise.resolve();

// ---------- Зв'язок із сервером ----------

function syncToServer() {
  syncChain = syncChain.then(async () => {
    const response = await fetch("/api/document", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shapes }),
    });
    if (!response.ok) {
      const data = await response.json();
      setStatus(data.error, true);
    }
  });
  return syncChain;
}

async function loadFromServer() {
  const response = await fetch("/api/document");
  const data = await response.json();
  shapes = data.shapes;
  selectedId = null;
  history = [clone(shapes)];
  historyIndex = 0;
  render();
}

async function fileOperation(line) {
  await syncChain;
  const response = await fetch("/api/command", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ line }),
  });
  const data = await response.json();
  if (!response.ok) {
    setStatus(data.error, true);
    return false;
  }
  setStatus(data.message);
  return true;
}

function setStatus(text, isError = false) {
  const status = $("status");
  status.textContent = text;
  status.classList.toggle("error", isError);
}

// ---------- Історія змін (Undo / Redo) ----------

function commit(next) {
  shapes = next;
  history = history.slice(0, historyIndex + 1);
  history.push(clone(next));
  if (history.length > MAX_HISTORY) {
    history.shift();
  }
  historyIndex = history.length - 1;
  syncToServer();
  render();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  shapes = clone(history[historyIndex]);
  syncToServer();
  render();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex++;
  shapes = clone(history[historyIndex]);
  syncToServer();
  render();
}

// ---------- Допоміжні функції ----------

function current() {
  return draft ?? shapes;
}

function selectedShape() {
  return current().find((s) => s.id === selectedId) ?? null;
}

function nextId() {
  return shapes.reduce((max, s) => Math.max(max, s.id), 0) + 1;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.round(((event.clientX - rect.left) * CANVAS.width) / rect.width),
    y: Math.round(((event.clientY - rect.top) * CANVAS.height) / rect.height),
  };
}

function setTool(name) {
  tool = name;
  document.querySelectorAll("button.tool").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === name);
  });
  canvas.classList.toggle("crosshair", name !== "select");
}

function isTyping() {
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
}

// ---------- Геометрія ----------

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function hitShape(shape, x, y) {
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
  return distanceToSegment(x, y, g.x1, g.y1, g.x2, g.y2) <= HIT;
}

function handlesOf(shape) {
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

function hitHandle(shape, x, y) {
  return handlesOf(shape).find((h) => Math.abs(h.x - x) <= HANDLE && Math.abs(h.y - y) <= HANDLE) ?? null;
}

function resizeShape(shape, handle, x, y) {
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
}

function moveShape(shape, dx, dy) {
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
}

function geometryFromDrag(type, a, b) {
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

function isLargeEnough(type, g) {
  if (type === "rectangle") return g.width >= 2 && g.height >= 2;
  if (type === "circle") return g.r >= 2;
  if (type === "ellipse") return g.rx >= 2 && g.ry >= 2;
  if (type === "arc") return g.r >= 2;
  if (BOX_TYPES.has(type)) return g.width >= 2 && g.height >= 2;
  return Math.hypot(g.x2 - g.x1, g.y2 - g.y1) >= 2;
}

// ---------- Малювання ----------

function render() {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  drawGrid();
  for (const shape of current()) {
    drawShape(shape);
  }
  if (preview) {
    drawShape(preview);
  }
  const selected = preview ? null : selectedShape();
  if (selected) {
    drawSelection(selected);
  }
  renderLayers();
  renderProps();
  updateHistoryButtons();
}

function drawGrid() {
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


function shadeColor(color, factor) {
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

function drawSolidShape(type, g, style) {
  const x = g.x || 0;
  const y = g.y || 0;
  const w = g.width || 0;
  const h = g.height || 0;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const base = style.fill !== "none" ? style.fill : "#cfe2ff";
  const light = shadeColor(base, 1.25);
  const dark = shadeColor(base, 0.7);
  const darker = shadeColor(base, 0.5);

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
    ctx.strokeStyle = shadeColor(base, 0.85);
    ctx.stroke();
  }
}

function drawVectorShape(type, g) {
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

function drawShape(shape) {
  const g = shape.geometry || {};
  ctx.save();
  ctx.lineWidth = shape.style.strokeWidth;
  ctx.strokeStyle = shape.style.stroke;
  ctx.fillStyle = shape.style.fill;
  const solid = new Set(["cube", "cuboid", "cylinder", "cone", "pyramid", "sphere"]);
  if (solid.has(shape.type)) {
    drawSolidShape(shape.type, g, shape.style);
    ctx.restore();
    return;
  }
  drawVectorShape(shape.type, g);
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

function drawSelection(shape) {
  const b = boundsOf(shape);
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = "#3c5bd6";
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
  ctx.setLineDash([]);
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#3c5bd6";
  for (const h of handlesOf(shape)) {
    ctx.beginPath();
    ctx.rect(h.x - HANDLE / 2, h.y - HANDLE / 2, HANDLE, HANDLE);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function boundsOf(shape) {
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

// ---------- Мишка ----------

function startInteraction(next) {
  draft = clone(shapes);
  interaction = next;
}

canvas.addEventListener("mousedown", (event) => {
  if (event.button !== 0) return;
  const point = canvasPoint(event);

  if (tool !== "select") {
    interaction = { mode: "create", start: point, end: point };
    preview = null;
    return;
  }

  const selected = selectedShape();
  if (selected) {
    const handle = hitHandle(selected, point.x, point.y);
    if (handle) {
      startInteraction({ mode: "resize", handle: handle.name, last: point });
      return;
    }
  }

  const hit = [...shapes].reverse().find((s) => hitShape(s, point.x, point.y));
  selectedId = hit ? hit.id : null;
  if (hit) {
    startInteraction({ mode: "move", last: point, moved: false });
  }
  render();
});

canvas.addEventListener("mousemove", (event) => {
  if (!interaction) return;
  const point = canvasPoint(event);

  if (interaction.mode === "create") {
    interaction.end = point;
    const geometry = geometryFromDrag(tool, interaction.start, point);
    preview = { id: 0, type: tool, geometry, style: { ...DEFAULT_STYLE } };
    render();
    return;
  }

  const shape = draft.find((s) => s.id === selectedId);
  if (!shape) return;

  if (interaction.mode === "resize") {
    resizeShape(shape, interaction.handle, point.x, point.y);
  } else {
    const dx = point.x - interaction.last.x;
    const dy = point.y - interaction.last.y;
    if (dx === 0 && dy === 0) return;
    moveShape(shape, dx, dy);
    interaction.moved = true;
  }
  interaction.last = point;
  render();
});

function finishInteraction() {
  if (!interaction) return;
  const finished = interaction;
  interaction = null;

  if (finished.mode === "create") {
    const geometry = preview?.geometry;
    preview = null;
    if (geometry && isLargeEnough(tool, geometry)) {
      const id = nextId();
      const shape = { id, type: tool, geometry, style: { ...DEFAULT_STYLE } };
      selectedId = id;
      setTool("select");
      commit([...shapes, shape]);
    } else {
      render();
    }
    return;
  }

  const next = draft;
  draft = null;
  if (JSON.stringify(next) !== JSON.stringify(shapes)) {
    commit(next);
  } else {
    render();
  }
}

canvas.addEventListener("mouseup", finishInteraction);
canvas.addEventListener("mouseleave", finishInteraction);

// ---------- Редагування вибраної фігури ----------

function updateSelected(mutate) {
  const next = clone(shapes);
  const target = next.find((s) => s.id === selectedId);
  if (!target) return;
  mutate(target);
  commit(next);
}

function selectShape(id) {
  selectedId = id;
  render();
}

function moveLayer(direction) {
  const index = shapes.findIndex((s) => s.id === selectedId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= shapes.length) return;
  const next = clone(shapes);
  [next[index], next[target]] = [next[target], next[index]];
  commit(next);
}

function renderLayers() {
  const list = $("layers");
  list.replaceChildren();
  $("emptyHint").hidden = shapes.length > 0;

  for (const shape of [...shapes].reverse()) {
    const item = document.createElement("li");
    item.classList.toggle("selected", shape.id === selectedId);

    const glyph = document.createElement("span");
    glyph.className = "glyph";
    glyph.textContent = TYPE_GLYPHS[shape.type];

    const name = document.createElement("span");
    name.textContent = `${TYPE_LABELS[shape.type]} ${shape.id}`;

    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = shape.style.fill !== "none" ? shape.style.fill : "transparent";
    swatch.style.borderColor = shape.style.stroke;

    item.append(glyph, name, swatch);
    item.addEventListener("click", () => selectShape(shape.id));
    list.append(item);
  }
}

function renderProps() {
  const shape = selectedShape();
  $("noSelection").hidden = Boolean(shape);
  $("props").hidden = !shape;
  if (!shape) return;

  const geometry = $("geometry");
  geometry.replaceChildren();
  const grid = document.createElement("div");
  grid.className = "geo-grid";
  for (const [field, label] of GEOMETRY_FIELDS[shape.type]) {
    const wrap = document.createElement("div");
    const caption = document.createElement("label");
    caption.textContent = label;
    const input = document.createElement("input");
    input.type = "number";
    input.step = "1";
    input.value = shape.geometry[field];
    input.addEventListener("change", () => {
      let value = Math.round(Number(input.value));
      if (!Number.isFinite(value)) {
        renderProps();
        return;
      }
      if (MIN_SIZE_FIELDS.has(field)) value = Math.max(1, value);
      updateSelected((s) => {
        s.geometry[field] = value;
      });
    });
    wrap.append(caption, input);
    grid.append(wrap);
  }
  const heading = document.createElement("label");
  heading.textContent = "Розміри та положення";
  geometry.append(heading, grid);

  if (shape.type === "text" || shape.type === "label") {
    const textWrap = document.createElement("div");
    const textLabel = document.createElement("label");
    textLabel.textContent = "Текст";
    const textInput = document.createElement("input");
    textInput.type = "text";
    textInput.value = shape.geometry.text || "Текст";
    textInput.addEventListener("change", () => {
      updateSelected((s) => {
        s.geometry.text = textInput.value;
      });
    });
    textWrap.append(textLabel, textInput);
    geometry.append(textWrap);
  }

  const isLine = shape.type === "line";
  $("fillRow").hidden = isLine;
  $("fillOn").checked = shape.style.fill !== "none";
  $("fillColor").value = shape.style.fill !== "none" ? shape.style.fill : "#ffffff";
  $("fillColor").disabled = !$("fillOn").checked;
  $("strokeColor").value = shape.style.stroke;
  $("strokeWidth").value = shape.style.strokeWidth;
  $("strokeWidthValue").textContent = `${shape.style.strokeWidth} px`;
}

$("fillOn").addEventListener("change", (event) => {
  updateSelected((s) => {
    s.style.fill = event.target.checked ? $("fillColor").value : "none";
  });
});

$("fillColor").addEventListener("change", (event) => {
  updateSelected((s) => {
    s.style.fill = event.target.value;
  });
});

$("strokeColor").addEventListener("change", (event) => {
  updateSelected((s) => {
    s.style.stroke = event.target.value;
  });
});

$("strokeWidth").addEventListener("input", (event) => {
  $("strokeWidthValue").textContent = `${event.target.value} px`;
});

$("strokeWidth").addEventListener("change", (event) => {
  const value = Number(event.target.value);
  updateSelected((s) => {
    s.style.strokeWidth = value;
  });
});

$("layerUp").addEventListener("click", () => moveLayer(1));
$("layerDown").addEventListener("click", () => moveLayer(-1));
$("deleteBtn").addEventListener("click", removeSelected);

function removeSelected() {
  if (selectedId === null) return;
  const id = selectedId;
  selectedId = null;
  commit(shapes.filter((s) => s.id !== id));
}

// ---------- Панель інструментів ----------

document.querySelectorAll("button.tool").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

function updateHistoryButtons() {
  $("undoBtn").disabled = historyIndex <= 0;
  $("redoBtn").disabled = historyIndex >= history.length - 1;
}

$("undoBtn").addEventListener("click", undo);
$("redoBtn").addEventListener("click", redo);

// ---------- Файли ----------

function fileName() {
  return $("fileName").value.trim() || "document.json";
}

$("saveBtn").addEventListener("click", () => {
  fileOperation(`save ${fileName()}`);
});

$("loadBtn").addEventListener("click", async () => {
  if (await fileOperation(`load ${fileName()}`)) {
    await loadFromServer();
  }
});

$("exportBtn").addEventListener("click", () => {
  const name = fileName().replace(/\.json$/i, "") + ".svg";
  fileOperation(`export ${name}`);
});

// ---------- Клавіатура ----------

document.addEventListener("keydown", (event) => {
  if (isTyping()) return;
  const mod = event.ctrlKey || event.metaKey;
  const key = event.key.toLowerCase();

  if (mod && key === "z") {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
  } else if (mod && key === "y") {
    event.preventDefault();
    redo();
  } else if (!mod && (event.key === "Delete" || event.key === "Backspace")) {
    event.preventDefault();
    removeSelected();
  } else if (event.key === "Escape") {
    selectedId = null;
    setTool("select");
    render();
  } else if (!mod && TOOL_BY_KEY[key]) {
    setTool(TOOL_BY_KEY[key]);
  }
});

// ---------- Меню та файли ----------

function closeMenus() {
  document.querySelectorAll(".menu").forEach((menu) => menu.classList.remove("open"));
}

document.querySelectorAll(".menu-trigger").forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    const menu = trigger.closest(".menu");
    const wasOpen = menu.classList.contains("open");
    closeMenus();
    if (!wasOpen) menu.classList.add("open");
  });
});

window.addEventListener("click", closeMenus);

function newScene() {
  closeMenus();
  shapes = [];
  selectedId = null;
  history = [[]];
  historyIndex = 0;
  syncToServer();
  render();
  setStatus("Створено нову сцену");
}

async function openSelectedFile(file) {
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
    await loadFromServer();
    setStatus(`Відкрито: ${file.name}`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

function saveAsDownload() {
  closeMenus();
  const data = { shapes };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName();
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus(`Збережено: ${fileName()}`);
}

document.querySelector('[data-action="new"]').addEventListener("click", newScene);
document.querySelector('[data-action="open"]').addEventListener("click", () => {
  closeMenus();
  $("fileInput").click();
});
document.querySelector('[data-action="save"]').addEventListener("click", () => {
  closeMenus();
  $("saveBtn").click();
});
document.querySelector('[data-action="saveAs"]').addEventListener("click", saveAsDownload);
document.querySelector('[data-action="export"]').addEventListener("click", () => {
  closeMenus();
  $("exportBtn").click();
});
document.querySelector('[data-action="about"]').addEventListener("click", () => {
  closeMenus();
  alert("Векторний графічний редактор\nЛабораторна/РГР з ООП\nВаріант 4");
});

$("fileInput").addEventListener("change", (event) => {
  const [file] = event.target.files || [];
  openSelectedFile(file);
  event.target.value = "";
});


// ---------- Стрічка інструментів (вкладки) ----------

const RIBBON_TABS = [
  { id: "main", label: "Головна" },
  { id: "basic", label: "2D фігури" },
  { id: "lines", label: "Лінії" },
  { id: "solid", label: "3D" },
  { id: "flow", label: "Схеми" },
  { id: "text", label: "Текст" },
];

const RIBBON_TOOLS = {
  main: ["select", "rectangle", "circle", "ellipse", "text"],
  basic: ["rectangle", "square", "circle", "ellipse", "triangle", "rhombus", "parallelogram", "star", "roundedrect", "polygon", "arc"],
  lines: ["line", "arrow", "polyline", "bezier"],
  solid: ["cube", "cuboid", "cylinder", "cone", "pyramid", "sphere"],
  flow: ["flowprocess", "flowdecision", "flowterminator", "callout", "speechbubble"],
  text: ["text"],
};

function iconForTool(type) {
  const c = document.createElement("canvas");
  c.width = 28;
  c.height = 28;
  const cx = c.getContext("2d");
  cx.scale(1, 1);
  const g = type === "line" || type === "arrow" || type === "polyline" || type === "bezier"
    ? { x1: 4, y1: 24, x2: 24, y2: 4 }
    : { x: 4, y: 4, width: 20, height: 20, cx: 14, cy: 14, r: 8, rx: 10, ry: 8, start: 0, end: 5 };
  cx.lineWidth = 2;
  cx.strokeStyle = "#1f2430";
  cx.fillStyle = "#cfe2ff";
  // reuse drawVectorShape by temporarily swapping ctx? Instead draw simple:
  cx.beginPath();
  if (type === "select") {
    cx.moveTo(6, 6); cx.lineTo(22, 14); cx.lineTo(14, 16); cx.lineTo(12, 22); cx.closePath(); cx.stroke();
  } else {
    // generic preview
    cx.rect(4, 4, 20, 20);
    cx.stroke();
  }
  return c.toDataURL();
}

function renderRibbon() {
  const tabsRoot = $("ribbonTabs");
  const bodyRoot = $("ribbonBody");
  tabsRoot.replaceChildren();
  bodyRoot.replaceChildren();

  RIBBON_TABS.forEach((tab, index) => {
    const tabBtn = document.createElement("button");
    tabBtn.className = "ribbon-tab" + (index === 0 ? " active" : "");
    tabBtn.textContent = tab.label;
    tabBtn.dataset.tab = tab.id;
    tabBtn.addEventListener("click", () => {
      document.querySelectorAll(".ribbon-tab").forEach((b) => b.classList.remove("active"));
      tabBtn.classList.add("active");
      document.querySelectorAll(".ribbon-panel").forEach((p) => p.classList.remove("active"));
      const panel = document.querySelector(`.ribbon-panel[data-tab="${tab.id}"]`);
      if (panel) panel.classList.add("active");
    });
    tabsRoot.append(tabBtn);
  });

  RIBBON_TABS.forEach((tab, index) => {
    const panel = document.createElement("div");
    panel.className = "ribbon-panel" + (index === 0 ? " active" : "");
    panel.dataset.tab = tab.id;
    const toolRow = document.createElement("div");
    toolRow.className = "tool-row";
    for (const type of RIBBON_TOOLS[tab.id] || []) {
      const btn = document.createElement("button");
      btn.className = "tool";
      btn.dataset.tool = type;
      btn.title = TYPE_LABELS[type] || type;
      const icon = document.createElement("span");
      icon.className = "tool-icon";
      icon.textContent = TYPE_GLYPHS[type] || "?";
      const label = document.createElement("span");
      label.className = "tool-label";
      label.textContent = TYPE_LABELS[type] || type;
      btn.append(icon, label);
      btn.addEventListener("click", () => setTool(type));
      toolRow.append(btn);
    }
    panel.append(toolRow);
    bodyRoot.append(panel);
  });
}

// ---------- Ініціалізація ----------

renderRibbon();
setTool("select");
loadFromServer().catch(() => setStatus("Не вдалося завантажити документ із сервера", true));
