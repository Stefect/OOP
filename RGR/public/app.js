const CANVAS = { width: 800, height: 600 };
const HIT_TOLERANCE = 6;
const FIELDS = {
  rectangle: ["x", "y", "width", "height"],
  circle: ["cx", "cy", "r"],
  line: ["x1", "y1", "x2", "y2"],
};
const COMMAND_NAME = { rectangle: "rect", circle: "circle", line: "line" };
const DEFAULT_VALUES = {
  x: 50, y: 50, width: 120, height: 80,
  cx: 300, cy: 200, r: 60,
  x1: 100, y1: 100, x2: 300, y2: 250,
};

const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d");

let shapes = [];
let selectedId = null;
let drag = null;

async function sendCommand(line) {
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
  await refresh();
  return true;
}

async function refresh() {
  const response = await fetch("/api/document");
  const data = await response.json();
  shapes = data.shapes;
  if (!shapes.some((shape) => shape.id === selectedId)) {
    selectedId = null;
  }
  render();
}

function setStatus(text, isError = false) {
  const status = $("status");
  status.textContent = text;
  status.classList.toggle("error", isError);
}

// ---------- Малювання ----------

function render() {
  ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
  for (const shape of shapes) {
    drawShape(shape);
  }
  if (selectedId !== null) {
    const shape = shapes.find((s) => s.id === selectedId);
    if (shape) drawSelection(shape);
  }
  renderList();
  renderSelectedInfo();
}

function drawShape(shape) {
  const g = shape.geometry;
  ctx.beginPath();
  if (shape.type === "rectangle") {
    ctx.rect(g.x, g.y, g.width, g.height);
  } else if (shape.type === "circle") {
    ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
  } else if (shape.type === "line") {
    ctx.moveTo(g.x1, g.y1);
    ctx.lineTo(g.x2, g.y2);
  }
  ctx.lineWidth = shape.style.strokeWidth;
  ctx.strokeStyle = shape.style.stroke;
  if (shape.style.fill !== "none" && shape.type !== "line") {
    ctx.fillStyle = shape.style.fill;
    ctx.fill();
  }
  ctx.stroke();
}

function drawSelection(shape) {
  const b = bounds(shape);
  ctx.save();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = "#3c7dd9";
  ctx.lineWidth = 1;
  ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
  ctx.restore();
}

function bounds(shape) {
  const g = shape.geometry;
  if (shape.type === "rectangle") {
    return { x: g.x, y: g.y, width: g.width, height: g.height };
  }
  if (shape.type === "circle") {
    return { x: g.cx - g.r, y: g.cy - g.r, width: g.r * 2, height: g.r * 2 };
  }
  const x = Math.min(g.x1, g.x2);
  const y = Math.min(g.y1, g.y2);
  return {
    x,
    y,
    width: Math.max(Math.abs(g.x2 - g.x1), 1),
    height: Math.max(Math.abs(g.y2 - g.y1), 1),
  };
}

// ---------- Вибір фігури мишею ----------

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSq = dx * dx + dy * dy;
  let t = lengthSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function hitTest(shape, x, y) {
  const g = shape.geometry;
  if (shape.type === "rectangle") {
    return x >= g.x && x <= g.x + g.width && y >= g.y && y <= g.y + g.height;
  }
  if (shape.type === "circle") {
    return Math.hypot(x - g.cx, y - g.cy) <= g.r;
  }
  return distanceToSegment(x, y, g.x1, g.y1, g.x2, g.y2) <= HIT_TOLERANCE;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: Math.round(((event.clientX - rect.left) * CANVAS.width) / rect.width),
    y: Math.round(((event.clientY - rect.top) * CANVAS.height) / rect.height),
  };
}

function moveLocal(shape, dx, dy) {
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

canvas.addEventListener("mousedown", (event) => {
  const point = canvasPoint(event);
  const hit = [...shapes].reverse().find((shape) => hitTest(shape, point.x, point.y));
  selectedId = hit ? hit.id : null;
  drag = hit ? { id: hit.id, lastX: point.x, lastY: point.y, totalX: 0, totalY: 0 } : null;
  render();
});

canvas.addEventListener("mousemove", (event) => {
  if (!drag) return;
  const point = canvasPoint(event);
  const dx = point.x - drag.lastX;
  const dy = point.y - drag.lastY;
  if (dx === 0 && dy === 0) return;
  const shape = shapes.find((s) => s.id === drag.id);
  if (shape) moveLocal(shape, dx, dy);
  drag.lastX = point.x;
  drag.lastY = point.y;
  drag.totalX += dx;
  drag.totalY += dy;
  render();
});

function finishDrag() {
  if (!drag) return;
  const { id, totalX, totalY } = drag;
  drag = null;
  if (totalX !== 0 || totalY !== 0) {
    sendCommand(`move ${id} ${totalX} ${totalY}`);
  }
}
canvas.addEventListener("mouseup", finishDrag);
canvas.addEventListener("mouseleave", finishDrag);

document.addEventListener("keydown", (event) => {
  if (event.key === "Delete" && selectedId !== null && !isTyping()) {
    sendCommand(`delete ${selectedId}`).then(() => (selectedId = null));
  }
});

function isTyping() {
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
}

// ---------- Бічні панелі ----------

function renderList() {
  const list = $("shapeList");
  list.replaceChildren();
  $("emptyHint").hidden = shapes.length > 0;

  for (const shape of shapes) {
    const item = document.createElement("li");
    item.classList.toggle("selected", shape.id === selectedId);

    const label = document.createElement("span");
    label.textContent = `#${shape.id} ${shape.type}`;
    item.append(label);

    const remove = document.createElement("button");
    remove.textContent = "×";
    remove.title = "Видалити";
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      sendCommand(`delete ${shape.id}`);
    });
    item.append(remove);

    item.addEventListener("click", () => {
      selectedId = shape.id;
      render();
    });
    list.append(item);
  }
}

function renderSelectedInfo() {
  const shape = shapes.find((s) => s.id === selectedId);
  $("moveBox").hidden = !shape;
  $("selectedInfo").hidden = Boolean(shape);
  if (!shape) return;

  const params = Object.entries(shape.geometry)
    .map(([key, value]) => `${key} = ${value}`)
    .join("<br>");
  $("selectedInfo").innerHTML = `<b>#${shape.id} ${shape.type}</b><br>${params}`;
  $("selectedInfo").hidden = false;
}

function renderAddFields() {
  const type = $("addType").value;
  const container = $("addFields");
  container.replaceChildren();
  for (const field of FIELDS[type]) {
    const wrap = document.createElement("div");
    const label = document.createElement("label");
    label.textContent = field;
    const input = document.createElement("input");
    input.type = "number";
    input.name = field;
    input.value = DEFAULT_VALUES[field];
    wrap.append(label, input);
    container.append(wrap);
  }
}

$("addType").addEventListener("change", renderAddFields);

$("addBtn").addEventListener("click", () => {
  const type = $("addType").value;
  const values = [...$("addFields").querySelectorAll("input")].map((input) => input.value);
  if (values.some((value) => value === "")) {
    setStatus("Заповніть усі поля", true);
    return;
  }
  sendCommand(`add ${COMMAND_NAME[type]} ${values.join(" ")}`);
});

$("moveBtn").addEventListener("click", () => {
  if (selectedId === null) return;
  sendCommand(`move ${selectedId} ${$("dx").value} ${$("dy").value}`);
});

$("deleteBtn").addEventListener("click", () => {
  if (selectedId === null) return;
  sendCommand(`delete ${selectedId}`).then(() => (selectedId = null));
});

function fileName() {
  const name = $("fileName").value.trim();
  return name || "document.json";
}

$("saveBtn").addEventListener("click", () => sendCommand(`save ${fileName()}`));
$("loadBtn").addEventListener("click", () => sendCommand(`load ${fileName()}`));
$("exportBtn").addEventListener("click", () => {
  const name = fileName().replace(/\.json$/i, "") + ".svg";
  sendCommand(`export ${name}`);
});

renderAddFields();
refresh();
