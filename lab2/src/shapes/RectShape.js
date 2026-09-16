import { Shape } from "./Shape.js";

export class RectShape extends Shape {
    show(ctx) {
        const { x1, y1, x2, y2 } = this.coords;

        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);

        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        ctx.restore();
    }
}