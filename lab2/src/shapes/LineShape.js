import { Shape } from "./Shape.js";

export class LineShape extends Shape {
    show(ctx) {
        const { x1, y1, x2, y2 } = this.coords;
        ctx.save();
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }
}