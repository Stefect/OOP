const BOX_TYPES = new Set(["rectangle","square","rhombus","diamond","cube","cylinder","triangle","roundedrect","roundedrectangle","star","callout","speechbubble","flowdecision","flowprocess","flowterminator","cuboid","pyramid","cone","sphere","parallelogram","text","label","polygon","polyline","bezier","arrowbox"]);

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

export class PropertiesPanel {
  constructor(state, { updateSelected }) {
    this.state = state;
    this.updateSelected = updateSelected;
  }

  render() {
    const shape = this.state.shapes.find((s) => s.id === this.state.selectedId) ?? this.state.draft?.find((s) => s.id === this.state.selectedId) ?? null;
    // selectedShape() logic: current() ?? draft ?? shapes
    const current = this.state.draft ?? this.state.shapes;
    const selected = current.find((s) => s.id === this.state.selectedId) ?? null;

    document.getElementById("noSelection").hidden = Boolean(selected);
    document.getElementById("props").hidden = !selected;
    if (!selected) return;

    const geometry = document.getElementById("geometry");
    geometry.replaceChildren();
    const grid = document.createElement("div");
    grid.className = "geo-grid";
    for (const [field, label] of (GEOMETRY_FIELDS[selected.type] || [])) {
      const wrap = document.createElement("div");
      const caption = document.createElement("label");
      caption.textContent = label;
      const input = document.createElement("input");
      input.type = "number";
      input.step = "1";
      input.value = selected.geometry[field];
      input.addEventListener("change", () => {
        let value = Math.round(Number(input.value));
        if (!Number.isFinite(value)) {
          this.render();
          return;
        }
        if (MIN_SIZE_FIELDS.has(field)) value = Math.max(1, value);
        this.updateSelected((s) => {
          s.geometry[field] = value;
        });
      });
      wrap.append(caption, input);
      grid.append(wrap);
    }
    const heading = document.createElement("label");
    heading.textContent = "Розміри та положення";
    geometry.append(heading, grid);

    if (selected.type === "text" || selected.type === "label") {
      const textWrap = document.createElement("div");
      const textLabel = document.createElement("label");
      textLabel.textContent = "Текст";
      const textInput = document.createElement("input");
      textInput.type = "text";
      textInput.value = selected.geometry.text || "Текст";
      textInput.addEventListener("change", () => {
        this.updateSelected((s) => {
          s.geometry.text = textInput.value;
        });
      });
      textWrap.append(textLabel, textInput);
      geometry.append(textWrap);
    }

    const isLine = selected.type === "line";
    document.getElementById("fillRow").hidden = isLine;
    document.getElementById("fillOn").checked = selected.style.fill !== "none";
    document.getElementById("fillColor").value = selected.style.fill !== "none" ? selected.style.fill : "#ffffff";
    document.getElementById("fillColor").disabled = !document.getElementById("fillOn").checked;
    document.getElementById("strokeColor").value = selected.style.stroke;
    document.getElementById("strokeWidth").value = selected.style.strokeWidth;
    document.getElementById("strokeWidthValue").textContent = `${selected.style.strokeWidth} px`;
  }
}