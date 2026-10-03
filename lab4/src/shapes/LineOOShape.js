import { Shape } from "./Shape.js";
import { LineShape } from "./LineShape.js";
import { EllipseShape } from "./EllipseShape.js";

export class LineOOShape extends Shape {
    #line;
    #startCircle;
    #endCircle;
    #radius = 6;

    constructor() {
        super();
        this.#line = new LineShape();
        this.#startCircle = new EllipseShape();
        this.#endCircle = new EllipseShape();
    }

    #updateParts() {
        const { x1, y1, x2, y2 } = this.coords;
        const r = this.#radius;

        this.#line.setCoords(x1, y1, x2, y2);
        this.#startCircle.setCoords(x1 - r, y1 - r, x1 + r, y1 + r);
        this.#endCircle.setCoords(x2 - r, y2 - r, x2 + r, y2 + r);
    }

    show(ctx) {
        this.#updateParts();
        this.#line.show(ctx);
        this.#startCircle.show(ctx, true);
        this.#endCircle.show(ctx, true);
    }

    drawTrail(ctx) {
        this.#updateParts();
        
        this.#line.drawTrail(ctx);
        this.#startCircle.drawTrail(ctx);
        this.#endCircle.drawTrail(ctx);
    }
}