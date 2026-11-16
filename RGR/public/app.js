import { History } from "./history.js";
import { EditorState } from "./state.js";
import { ServerSync } from "./serverSync.js";
import { Renderer } from "./renderer.js";
import { InteractionController } from "./interactionController.js";
import { LayersPanel } from "./layersPanel.js";
import { PropertiesPanel } from "./propertiesPanel.js";
import { Ribbon } from "./ribbon.js";

const CANVAS = { width: 2000, height: 2000 };

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

const appState = new EditorState();
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
const layersPanel = new LayersPanel(appState, { selectShape });
const propertiesPanel = new PropertiesPanel(appState, { updateSelected });
const ribbon = new Ribbon({ setTool });

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

function setTool(name) {
  appState.tool = name;
  document.querySelectorAll("button.tool").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === name);
  });
  canvas.classList.toggle("crosshair", name !== "select");
}

function nextId() {
  return appState.shapes.reduce((max, s) => Math.max(max, s.id), 0) + 1;
}

function render() {
  renderer.renderScene();
  layersPanel.render();
  propertiesPanel.render();
  updateHistoryButtons();
}


// ---------- Редагування вибраної фігури ----------

function updateSelected(mutate) {
  const next = clone(appState.shapes);
  const target = next.find((s) => s.id === appState.selectedId);
  if (!target) return;
  mutate(target);
  commit(next);
}

function selectShape(id) {
  appState.selectedId = id;
  render();
}

function moveLayer(direction) {
  const index = appState.shapes.findIndex((s) => s.id === appState.selectedId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= appState.shapes.length) return;
  const next = clone(appState.shapes);
  [next[index], next[target]] = [next[target], next[index]];
  commit(next);
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

function selectAll() {
  appState.selectedIds = appState.shapes.map((s) => s.id);
  appState.selectedId = appState.shapes.length ? appState.shapes[appState.shapes.length - 1].id : null;
  render();
}

function removeSelected() {
  if (appState.selectedIds.length === 0 && appState.selectedId === null) return;
  const ids = appState.selectedIds.length ? appState.selectedIds : [appState.selectedId];
  appState.selectedId = null;
  appState.selectedIds = [];
  for (const id of ids) {
    for (const key of Object.keys(appState.groups)) {
      appState.groups[key] = appState.groups[key].filter((x) => x !== id);
      if (appState.groups[key].length < 2) delete appState.groups[key];
    }
  }
  commit(appState.shapes.filter((s) => !ids.includes(s.id)));
}

function duplicateSelected() {
  if (appState.selectedIds.length === 0 && appState.selectedId === null) return;
  const ids = appState.selectedIds.length ? appState.selectedIds : [appState.selectedId];
  const copies = [];
  for (const id of ids) {
    const original = appState.shapes.find((s) => s.id === id);
    if (!original) continue;
    const copy = structuredClone(original);
    copy.id = nextId();
    interactionController.moveShape(copy, 10, 10);
    copies.push(copy);
  }
  if (copies.length === 0) return;
  appState.selectedIds = copies.map((c) => c.id);
  appState.selectedId = copies[copies.length - 1].id;
  commit([...appState.shapes, ...copies]);
}

function groupSelected() {
  if (appState.selectedIds.length < 2) return;
  const nextId = Object.keys(appState.groups).reduce((m, k) => Math.max(m, Number(k)), 0) + 1;
  appState.groups[nextId] = [...appState.selectedIds];
  setStatus(`Згруповано у групу #${nextId}`);
  commit(appState.shapes);
}

function ungroupSelected() {
  if (appState.selectedId === null) return;
  const gid = Object.keys(appState.groups).find((k) => appState.groups[k].includes(appState.selectedId));
  if (!gid) return;
  delete appState.groups[gid];
  setStatus(`Групу #${gid} розформовано`);
  commit(appState.shapes);
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
  } else if (mod && key === "d") {
    event.preventDefault();
    duplicateSelected();
  } else if (mod && key === "g") {
    event.preventDefault();
    groupSelected();
  } else if (mod && key === "u") {
    event.preventDefault();
    ungroupSelected();
  } else if (mod && key === "a") {
    event.preventDefault();
    selectAll();
  } else if (mod && (event.key === "]" || event.key === "}")) {
    event.preventDefault();
    moveLayer(1);
  } else if (mod && (event.key === "[" || event.key === "{")) {
    event.preventDefault();
    moveLayer(-1);
  } else if (!mod && (event.key === "Delete" || event.key === "Backspace")) {
    event.preventDefault();
    removeSelected();
  } else if (event.key === "Escape") {
    appState.selectedId = null;
    appState.selectedIds = [];
    setTool("select");
    render();
  } else if (!mod && key === "g") {
    event.preventDefault();
    const enabled = interactionController.toggleSnap();
    setStatus(enabled ? "Прив'язка до сітки увімкнена" : "Прив'язка до сітки вимкнена");
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
  appState.shapes = [];
  appState.selectedId = null;
  appState.selectedIds = [];
  appState.groups = {};
  historyManager.reset(appState.shapes);
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
  const data = { shapes: appState.shapes, groups: appState.groups };
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



// ---------- Ініціалізація ----------

ribbon.render();
setTool("select");
serverSync.load().catch(() => setStatus("Не вдалося завантажити документ із сервера", true));
