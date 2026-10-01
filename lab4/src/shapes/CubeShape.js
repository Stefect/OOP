import { Shape } from "./Shape.js";
import { LineShape } from "./LineShape.js";

export class CubeShape extends Shape {
    #lines = [];

    constructor() {
        super();
        for (let i = 0; i < 12; i++) {
            this.#lines.push(new LineShape());
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

        return { f, b };
    }

    show(ctx) {
        const { f, b } = this.#getVertices();
        if (f[1].x === f[0].x || f[2].y === f[1].y) return;

        const edges = [
            [f[0], f[1]], [f[1], f[2]], [f[2], f[3]], [f[3], f[0]],
            [b[0], b[1]], [b[1], b[2]], [b[2], b[3]], [b[3], b[0]],
            [f[0], b[0]], [f[1], b[1]], [f[2], b[2]], [f[3], b[3]]
        ];

        edges.forEach(([p1, p2], index) => {
            this.#lines[index].setCoords(p1.x, p1.y, p2.x, p2.y);
            this.#lines[index].show(ctx);
        });
    }

    drawTrail(ctx) {
        const { f, b } = this.#getVertices();
        if (f[1].x === f[0].x || f[2].y === f[1].y) return;

        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.strokeRect(f[0].x, f[0].y, f[1].x - f[0].x, f[2].y - f[1].y);
        ctx.strokeRect(b[0].x, b[0].y, b[1].x - b[0].x, b[2].y - b[1].y);

        for (let i = 0; i < 4; i++) {
            ctx.moveTo(f[i].x, f[i].y);
            ctx.lineTo(b[i].x, b[i].y);
        }
        ctx.stroke();

        ctx.restore();
    }
}