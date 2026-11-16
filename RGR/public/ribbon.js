const RIBBON_TABS = [
  { id: "main", label: "Головна" },
  { id: "basic", label: "2D фігури" },
  { id: "lines", label: "Лінії" },
  { id: "solid", label: "3D" },
  { id: "text", label: "Текст" },
];

const RIBBON_TOOLS = {
  main: ["select", "square", "ellipse", "text"],
  basic: ["square", "ellipse", "triangle", "rhombus", "parallelogram", "star", "roundedrect", "polygon", "arc"],
  lines: ["line", "arrow", "polyline", "bezier"],
  solid: ["cube", "cylinder", "cone", "pyramid", "sphere"],
  text: ["text"],
};

const TYPE_LABELS = {
  square: "Квадрат", ellipse: "Еліпс", rhombus: "Ромб", cube: "Куб", cylinder: "Циліндр",
  triangle: "Трикутник", roundedrect: "Скруглений прямокутник", star: "Зірка",
  pyramid: "Піраміда", cone: "Конус", sphere: "Сфера",
  parallelogram: "Паралелограм", text: "Текст", polygon: "Багатокутник", polyline: "Ломана", bezier: "Крива Безьє", arc: "Дуга/Сектор", line: "Лінія", arrow: "Стрілка",
  group: "Група"
};

const TYPE_GLYPHS = {
  select: "↖", square: "□", ellipse: "◯", rhombus: "◇", cube: "▣", cylinder: "⏢",
  triangle: "△", roundedrect: "▢", star: "★",
  pyramid: "△", cone: "△", sphere: "●", parallelogram: "▱", text: "T",
  polygon: "⬠", polyline: "⤼", bezier: "∿", arc: "◡", line: "╱", arrow: "➔", group: "⊞",
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