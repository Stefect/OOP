import { PointShape } from "../shapes/PointShape.js";
import { LineShape } from "../shapes/LineShape.js";
import { RectShape } from "../shapes/RectShape.js";
import { EllipseShape } from "../shapes/EllipseShape.js";
import { LineOOShape } from "../shapes/LineOOShape.js";
import { CubeShape } from "../shapes/CubeShape.js";

export class MyEditor {
    // Приватні статичні поля для класичної реалізації Singleton
    static #instance = null;
    static #isInternalConstructing = false;

    #canvas;
    #ctx;
    #shapes;
    #capacity;
    #currentShape;
    #shapeTypeRegistry;
    #currentType;
    #isDrawing;
    #abortController;

    constructor(canvasId) {
        // Захист від прямого створення через `new MyEditor()`
        if (!MyEditor.#isInternalConstructing) {
            throw new Error("Не можна створювати MyEditor через `new`. Використовуйте MyEditor.getInstance(canvasId)!");
        }

        this.#canvas = document.getElementById(canvasId);
        this.#ctx = this.#canvas.getContext("2d");

        this.#capacity = 105;
        this.#shapes = [];

        this.#shapeTypeRegistry = {
            POINT: PointShape,
            LINE: LineShape,
            RECTANGLE: RectShape,
            ELLIPSE: EllipseShape,
            LINEOO: LineOOShape,
            CUBE: CubeShape
        };

        this.#currentType = "RECTANGLE";
        this.#currentShape = null;
        this.#isDrawing = false;
        this.#abortController = new AbortController();

        this.#bindEvents();
        this.#onResize();
    }

    // Класичний метод отримання єдиного екземпляра Singleton
    static getInstance(canvasId) {
        if (!MyEditor.#instance) {
            MyEditor.#isInternalConstructing = true;
            MyEditor.#instance = new MyEditor(canvasId);
            MyEditor.#isInternalConstructing = false;
        }
        return MyEditor.#instance;
    }

    #bindEvents() {
        const signal = this.#abortController.signal;

        window.addEventListener("resize", () => this.#onResize(), { signal });
        this.#canvas.addEventListener("pointerdown", (e) => this.#onPointerDown(e), { signal });
        this.#canvas.addEventListener("pointermove", (e) => this.#onPointerMove(e), { signal });
        this.#canvas.addEventListener("pointerup", (e) => this.#onPointerUp(e), { signal });
        this.#canvas.addEventListener("pointerleave", () => this.#onPointerCancel(), { signal });
    }

    #onResize() {
        const parent = this.#canvas.parentElement;
        if (!parent) return;
        this.#canvas.width = parent.clientWidth;
        this.#canvas.height = parent.clientHeight;
        this.redraw();
    }

    setShapeType(type) {
        if (this.#shapeTypeRegistry[type]) {
            this.#currentType = type;
        }
    }

    #getCanvasPos(e) {
        const rect = this.#canvas.getBoundingClientRect();
        return {
            x: Math.round(e.clientX - rect.left),
            y: Math.round(e.clientY - rect.top)
        };
    }

    #onPointerDown(e) {
        if (e.button !== 0) return;
        const { x, y } = this.#getCanvasPos(e);

        if (this.#currentType === "POINT") {
            if (this.#shapes.length >= this.#capacity) {
                alert(`Досягнуто ліміту списку у ${this.#capacity} фігур!`);
                return;
            }
            const point = new PointShape();
            point.setCoords(x, y, x, y);
            this.#shapes.push(point);
            this.redraw();
            return;
        }

        const ShapeClass = this.#shapeTypeRegistry[this.#currentType];
        if (!ShapeClass) return;

        this.#isDrawing = true;
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

        if (x1 !== x || y1 !== y) {
            if (this.#shapes.length >= this.#capacity) {
                alert(`Досягнуто ліміту списку у ${this.#capacity} фігур!`);
            } else {
                this.#shapes.push(this.#currentShape);
            }
        }

        this.#currentShape = null;
        this.redraw();
    }

    #onPointerCancel() {
        if (!this.#isDrawing) return;
        this.#isDrawing = false;
        this.#currentShape = null;
        this.redraw();
    }

    redraw() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        for (const shape of this.#shapes) {
            shape.show(this.#ctx);
        }
    }

    clear() {
        this.#shapes = [];
        this.#currentShape = null;
        this.#isDrawing = false;
        this.redraw();
    }

    destroy() {
        this.#abortController.abort();
        this.#shapes = [];
        this.#currentShape = null;
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        MyEditor.#instance = null;
    }
}