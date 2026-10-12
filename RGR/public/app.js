const CANVAS = { width: 800, height: 600 };
const GRID = 20;
const HANDLE = 8;
const HIT = 6;
const MAX_HISTORY = 100;

const TYPE_LABELS = { rectangle: "Прямокутник", circle: "Коло", line: "Лінія" };
const TYPE_GLYPHS = { rectangle: "▭", circle: "◯", line: "╱" };
const TOOL_BY_KEY = { v: "select", r: "rectangle", c: "circle", l: "line" };
const GEOMETRY_FIELDS = {
  rectangle: [["x", "X"], ["y", "Y"], ["width", "Ширина"], ["height", "Висота"]],
  circle: [["cx", "X центру"], ["cy", "Y центру"], ["r", "Радіус"]],
  line: [["x1", "X1"], ["y1", "Y1"], ["x2", "X2"], ["y2", "Y2"]],
};
const MIN_SIZE_FIELDS = new Set(["width", "height", "r"]);
const DEFAULT_STYLE = { stroke: "#2b5797", fill: "#cfe2ff", strokeWidth: 2 };

const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d");

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
  return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
}

function isLargeEnough(type, g) {
  if (type === "rectangle") return g.width >= 2 && g.height >= 2;
  if (type === "circle") return g.r >= 2;
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

function drawShape(shape) {
  const g = shape.geometry;
  ctx.beginPath();
  if (shape.type === "rectangle") {
    ctx.rect(g.x, g.y, g.width, g.height);
  } else if (shape.type === "circle") {
    ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
  } else {
    ctx.moveTo(g.x1, g.y1);
    ctx.lineTo(g.x2, g.y2);
  }
  if (shape.style.fill !== "none" && shape.type !== "line") {
    ctx.fillStyle = shape.style.fill;
    ctx.fill();
  }
  ctx.lineWidth = shape.style.strokeWidth;
  ctx.strokeStyle = shape.style.stroke;
  ctx.stroke();
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

// ---------- Старт ----------

setTool("select");
loadFromServer().catch(() => setStatus("Не вдалося підключитися до сервера", true));
