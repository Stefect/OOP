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

export class Ribbon {
  constructor({ setTool }) {
    this.setTool = setTool;
  }

  render() {
    const tabsRoot = document.getElementById("ribbonTabs");
    const bodyRoot = document.getElementById("ribbonBody");
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
        btn.addEventListener("click", () => this.setTool(type));
        toolRow.append(btn);
      }
      panel.append(toolRow);
      bodyRoot.append(panel);
    });
  }
}