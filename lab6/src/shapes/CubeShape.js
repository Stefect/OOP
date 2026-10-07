import { Shape } from "./Shape.js";
import { LineShape } from "./LineShape.js";
import { RectShape } from "./RectShape.js";

export class CubeShape extends Shape {
    #frontRect;
    #backRect;
    #connectingLines = [];

    constructor() {
        super();
        this.#frontRect = new RectShape();
        this.#backRect = new RectShape();

        for (let i = 0; i < 4; i++) {
            this.#connectingLines.push(new LineShape());
        }
    }

    #getVertices() {
        const { x1, y1, x2, y2 } = this.coords;
        
        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const right = Math.max(x1, x2);
        const bottom = Math.max(y1, y2);

        const w = right - left;
        const h = bottom - top;
        const dx = Math.round(w * 0.35);
        const dy = Math.round(h * 0.35);

        const f = [
            { x: left, y: top },
            { x: right, y: top },
            { x: right, y: bottom },
            { x: left, y: bottom }
        ];

        const b = [
            { x: left + dx, y: top - dy },
            { x: right + dx, y: top - dy },
            { x: right + dx, y: bottom - dy },
            { x: left + dx, y: bottom - dy }
        ];

        return { f, b, left, top, right, bottom, dx, dy };
    }

    #updateParts() {
        const { f, b, left, top, right, bottom, dx, dy } = this.#getVertices();

        const frontCenterX = Math.round((left + right) / 2);
        const frontCenterY = Math.round((top + bottom) / 2);
        const backCenterX = frontCenterX + dx;
        const backCenterY = frontCenterY - dy;

        this.#frontRect.setCoords(frontCenterX, frontCenterY, right, bottom);
        this.#backRect.setCoords(backCenterX, backCenterY, right + dx, bottom - dy);

        for (let i = 0; i < 4; i++) {
            this.#connectingLines[i].setCoords(f[i].x, f[i].y, b[i].x, b[i].y);
        }
    }

    show(ctx) {
        const { f } = this.#getVertices();
        if (f[1].x === f[0].x || f[2].y === f[1].y) return;

        this.#updateParts();

        this.#backRect.show(ctx, true);
        for (let i = 0; i < 4; i++) {
            this.#connectingLines[i].show(ctx);
        }
        this.#frontRect.show(ctx, true);
    }
    drawTrail(ctx) {
        const { f } = this.#getVertices();
        if (f[1].x === f[0].x || f[2].y === f[1].y) return;

        this.#updateParts();

        this.#backRect.drawTrail(ctx);
        for (let i = 0; i < 4; i++) {
            this.#connectingLines[i].drawTrail(ctx);
        }
        this.#frontRect.drawTrail(ctx);
    }
}