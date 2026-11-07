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

export class LayersPanel {
  constructor(state, { selectShape }) {
    this.state = state;
    this.selectShape = selectShape;
  }

  render() {
    const list = document.getElementById("layers");
    list.replaceChildren();
    document.getElementById("emptyHint").hidden = this.state.shapes.length > 0;

    for (const shape of [...this.state.shapes].reverse()) {
      const item = document.createElement("li");
      item.classList.toggle("selected", this.state.selectedIds.includes(shape.id));

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
      item.addEventListener("click", () => this.selectShape(shape.id));
      list.append(item);
    }
  }
}