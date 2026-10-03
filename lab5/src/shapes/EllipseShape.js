import { Shape } from "./Shape.js";

export class EllipseShape extends Shape {
    #getGeometry() {
        const { x1, y1, x2, y2 } = this.coords;
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const maxX = Math.max(x1, x2);
        const maxY = Math.max(y1, y2);

        const rx = (maxX - minX) / 2;
        const ry = (maxY - minY) / 2;
        const cx = minX + rx;
        const cy = minY + ry;

        return { cx, cy, rx, ry };
    }

    show(ctx) {
        const { cx, cy, rx, ry } = this.#getGeometry();
        if (rx === 0 || ry === 0) return;

        ctx.save();
        ctx.fillStyle = "#ec4899";
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawTrail(ctx) {
        const { cx, cy, rx, ry } = this.#getGeometry();
        if (rx === 0 || ry === 0) return;

        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]); // 👈 Єдиний пунктир для всіх фігур
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
}