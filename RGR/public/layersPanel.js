const TYPE_LABELS = {
  rectangle: "Прямокутник", square: "Квадрат", circle: "Коло", ellipse: "Еліпс", rhombus: "Ромб", cube: "Куб", cylinder: "Циліндр",
  triangle: "Трикутник", roundedrect: "Скруглений прямокутник", star: "Зірка",
  pyramid: "Піраміда", cone: "Конус", sphere: "Сфера",
  parallelogram: "Паралелограм", text: "Текст", polygon: "Багатокутник", polyline: "Ломана", bezier: "Крива Безьє", arc: "Дуга/Сектор", line: "Лінія", arrow: "Стрілка",
  group: "Група"
};
const TYPE_GLYPHS = {
  select: "↖", rectangle: "▭", square: "□", circle: "○", ellipse: "◯", rhombus: "◇", cube: "▣", cylinder: "⏢",
  triangle: "△", roundedrect: "▢", star: "★",
  pyramid: "△", cone: "△", sphere: "●", parallelogram: "▱", text: "T",
  polygon: "⬠", polyline: "⤼", bezier: "∿", arc: "◡", line: "╱", arrow: "➔", group: "⊞",
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