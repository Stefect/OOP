import { Shape } from "./Shape.js";

export class RectShape extends Shape {
    #getBounds() {
        const { x1, y1, x2, y2 } = this.coords;
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        return {
            x: x1 - dx,
            y: y1 - dy,
            w: dx * 2,
            h: dy * 2
        };
    }

    show(ctx, isOutlineOnly = false) {
        const { x, y, w, h } = this.#getBounds();
        if (w === 0 || h === 0) return;

        ctx.save();
        if (isOutlineOnly) {
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, y, w, h);
        } else {
            ctx.fillStyle = "#3b82f6";
            ctx.fillRect(x, y, w, h);
        }
        ctx.restore();
    }

    drawTrail(ctx) {
        const { x, y, w, h } = this.#getBounds();
        if (w === 0 || h === 0) return;

        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    }
}