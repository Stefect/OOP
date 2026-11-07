import { History } from "./history.js";
import { ServerSync } from "./serverSync.js";
import { Renderer } from "./renderer.js";
import { InteractionController } from "./interactionController.js";

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

const appState = {
  get shapes() { return shapes; },
  set shapes(value) { shapes = value; },
  get draft() { return draft; },
  set draft(value) { draft = value; },
  get preview() { return preview; },
  set preview(value) { preview = value; },
  get selectedId() { return selectedId; },
  set selectedId(value) { selectedId = value; },
  get tool() { return tool; },
  set tool(value) { tool = value; },
  get interaction() { return interaction; },
  set interaction(value) { interaction = value; },
  get history() { return history; },
  set history(value) { history = value; },
  get historyIndex() { return historyIndex; },
  set historyIndex(value) { historyIndex = value; },
};
const historyManager = new History(appState);
const serverSync = new ServerSync(appState, historyManager, setStatus, render);
const renderer = new Renderer(appState, canvas, ctx);
const interactionController = new InteractionController(appState, renderer, canvas, {
  commit,
  render,
  setTool,
  nextId: () => nextId(),
});
interactionController.bind();

function setStatus(text, isError = false) {
  const status = $("status");
  status.textContent = text;
  status.classList.toggle("error", isError);
}

// ---------- Історія змін (Undo / Redo) ----------

function commit(next) {
  historyManager.commit(next);
  serverSync.sync();
  render();
}

function undo() {
  if (!historyManager.undo()) return;
  serverSync.sync();
  render();
}

function redo() {
  if (!historyManager.redo()) return;
  serverSync.sync();
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
  $("undoBtn").disabled = !historyManager.canUndo();
  $("redoBtn").disabled = !historyManager.canRedo();
}

$("undoBtn").addEventListener("click", undo);
$("redoBtn").addEventListener("click", redo);

// ---------- Файли ----------

function fileName() {
  return $("fileName").value.trim() || "document.json";
}

$("saveBtn").addEventListener("click", () => {
  serverSync.fileOperation(`save ${fileName()}`);
});

$("loadBtn").addEventListener("click", async () => {
  if (await serverSync.fileOperation(`load ${fileName()}`)) {
    await serverSync.load();
  }
});

$("exportBtn").addEventListener("click", () => {
  const name = fileName().replace(/\.json$/i, "") + ".svg";
  serverSync.fileOperation(`export ${name}`);
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
  historyManager.reset(shapes);
  serverSync.sync();
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
    await serverSync.load();
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
serverSync.load().catch(() => setStatus("Не вдалося завантажити документ із сервера", true));
