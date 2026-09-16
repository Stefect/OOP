import { PointShape } from "../shapes/PointShape.js";
import { LineShape } from "../shapes/LineShape.js";
import { RectShape } from "../shapes/RectShape.js";
import { EllipseShape } from "../shapes/EllipseShape.js";

export class MyEditor {
    #canvas;
    #ctx;
    #pcshape;
    #shapeCount;
    #capacity;
    #currentShape;
    #shapeTypeRegistry;
    #currentType;
    #isDrawing;

    constructor(canvasId) {
        this.#canvas = document.getElementById(canvasId);
        this.#ctx = this.#canvas.getContext("2d");

        this.#capacity = 104;
        this.#pcshape = new Array(this.#capacity).fill(null);
        this.#shapeCount = 0;

        this.#shapeTypeRegistry = {
            POINT: PointShape,
            LINE: LineShape,
            RECTANGLE: RectShape,
            ELLIPSE: EllipseShape
        };

        this.#currentType = "RECTANGLE";
        this.#currentShape = null;
        this.#isDrawing = false;

        this.#bindEvents();
        this.#onResize();
    }

    #bindEvents() {
        window.addEventListener("resize", () => this.#onResize());
        this.#canvas.addEventListener("pointerdown", (e) => this.#onPointerDown(e));
        this.#canvas.addEventListener("pointermove", (e) => this.#onPointerMove(e));
        this.#canvas.addEventListener("pointerup", (e) => this.#onPointerUp(e));
    }

    #onResize() {
        const parent = this.#canvas.parentElement;
        this.#canvas.width = parent.clientWidth;
        this.#canvas.height = parent.clientHeight;
        this.redraw();
    }

    setShapeType(type) {
        this.#currentType = type;
    }

    #getCanvasPos(e) {
        const rect = this.#canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    #onPointerDown(e) {
        this.#isDrawing = true;
        const { x, y } = this.#getCanvasPos(e);

        const ShapeClass = this.#shapeTypeRegistry[this.#currentType];
        this.#currentShape = new ShapeClass();
        this.#currentShape.setCoords(x, y, x, y);
    }

    #onPointerMove(e) {
        if (!this.#isDrawing || !this.#currentShape) return;
        const { x, y } = this.#getCanvasPos(e);
        const { x1, y1 } = this.#currentShape.coords;

        this.#currentShape.setCoords(x1, y1, x, y);

        this.redraw();
        this.#currentShape.drawTrail(this.#ctx);
    }

    #onPointerUp(e) {
        if (!this.#isDrawing || !this.#currentShape) return;
        this.#isDrawing = false;

        const { x, y } = this.#getCanvasPos(e);
        const { x1, y1 } = this.#currentShape.coords;
        this.#currentShape.setCoords(x1, y1, x, y);

        if (this.#shapeCount < this.#capacity) {
            this.#pcshape[this.#shapeCount++] = this.#currentShape;
        } else {
            alert("Переповнення статичного масиву фігур!");
        }

        this.#currentShape = null;
        this.redraw();
    }

    redraw() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        for (let i = 0; i < this.#shapeCount; i++) {
            this.#pcshape[i].show(this.#ctx);
        }
    }

    clear() {
        this.#pcshape.fill(null);
        this.#shapeCount = 0;
        this.redraw();
    }
}
