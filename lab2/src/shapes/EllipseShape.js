import { Shape } from "./Shape.js";

export class EllipseShape extends Shape {
    show(ctx) {
        const { x1, y1, x2, y2 } = this.coords;
        const rx = Math.abs(x2 - x1);
        const ry = Math.abs(y2 - y1);

        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.fillStyle = "#FFB6C1"; 

        ctx.beginPath();
        ctx.ellipse(x1, y1, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}