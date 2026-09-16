import { Shape } from "./Shape.js";

export class PointShape extends Shape {
    show(ctx) {
        const { x2, y2 } = this.coords;
        ctx.save();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(x2, y2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawTrail(ctx) {
        this.show(ctx);
    }
}