import { TypedShape } from "./TypedShape.js";

export class ArcShape extends TypedShape {
  static tag = "path";
  static fields = ["cx", "cy", "r", "start", "end"];
  static nonNegativeFields = ["r"];

  constructor(id, geometry, style = {}, type = "arc") {
    super(id, geometry, style, type);
  }

  move(dx, dy) {
    this._geometry.cx += dx;
    this._geometry.cy += dy;
  }

  toSvg() {
    const g = this.geometry;
    const style = this.style;
    const start = Number.isFinite(g.start) ? g.start : 0;
    const end = Number.isFinite(g.end) ? g.end : Math.PI * 2;
    const x1 = g.cx + g.r * Math.cos(start);
    const y1 = g.cy + g.r * Math.sin(start);
    const x2 = g.cx + g.r * Math.cos(end);
    const y2 = g.cy + g.r * Math.sin(end);
    const largeArc = Math.abs(end - start) > Math.PI ? 1 : 0;
    const sweep = end >= start ? 1 : 0;

    if (this.type === "sector") {
      const d = `M ${g.cx} ${g.cy} L ${x1} ${y1} A ${g.r} ${g.r} 0 ${largeArc} ${sweep} ${x2} ${y2} Z`;
      return `<path d="${d}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" />`;
    }
    const d = `M ${x1} ${y1} A ${g.r} ${g.r} 0 ${largeArc} ${sweep} ${x2} ${y2}`;
    return `<path d="${d}" fill="none" stroke="${style.stroke}" stroke-width="${style.strokeWidth}" />`;
  }
}