import { PointShape } from "../shapes/PointShape.js";
import { LineShape } from "../shapes/LineShape.js";
import { RectShape } from "../shapes/RectShape.js";
import { EllipseShape } from "../shapes/EllipseShape.js";
import { LineOOShape } from "../shapes/LineOOShape.js";
import { CubeShape } from "../shapes/CubeShape.js";

export class MyEditor {
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
    #highlightedIndex = -1; 
    #onChangeCallbacks = []; 

    constructor(canvasId) {
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

    static getInstance(canvasId) {
        if (!MyEditor.#instance) {
            MyEditor.#isInternalConstructing = true;
            MyEditor.#instance = new MyEditor(canvasId);
            MyEditor.#isInternalConstructing = false;
        }
        return MyEditor.#instance;
    }

    subscribe(callback) {
        if (typeof callback === "function") {
            this.#onChangeCallbacks.push(callback);
        }
    }

    #notify() {
        const data = this.getShapesData();
        this.#onChangeCallbacks.forEach(cb => cb(data));
    }

    getShapesData() {
        const typeNames = {
            PointShape: "Крапка",
            LineShape: "Лінія",
            RectShape: "Прямокутник",
            EllipseShape: "Еліпс",
            LineOOShape: "Лінія з кружечками",
            CubeShape: "Каркас куба"
        };

        return this.#shapes.map(s => {
            const className = s.constructor.name;
            const coords = s.coords;
            return {
                name: typeNames[className] || className,
                rawType: className,
                x1: coords.x1,
                y1: coords.y1,
                x2: coords.x2,
                y2: coords.y2
            };
        });
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
        this.#highlightedIndex = -1; // Скидаємо виділення при малюванні

        if (this.#currentType === "POINT") {
            if (this.#shapes.length >= this.#capacity) {
                alert(`Досягнуто ліміту списку у ${this.#capacity} фігур!`);
                return;
            }
            const point = new PointShape();
            point.setCoords(x, y, x, y);
            this.#shapes.push(point);
            this.redraw();
            this.#notify();
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
                this.#notify();
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

    highlightShape(index) {
        this.#highlightedIndex = index;
        this.redraw();
    }

    removeShape(index) {
        if (index >= 0 && index < this.#shapes.length) {
            this.#shapes.splice(index, 1);
            this.#highlightedIndex = -1;
            this.redraw();
            this.#notify();
        }
    }

    redraw() {
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        this.#shapes.forEach((shape, index) => {
            shape.show(this.#ctx);

            if (index === this.#highlightedIndex) {
                const { x1, y1, x2, y2 } = shape.coords;
                const minX = Math.min(x1, x2) - 4;
                const minY = Math.min(y1, y2) - 4;
                const maxX = Math.max(x1, x2) + 4;
                const maxY = Math.max(y1, y2) + 4;

                this.#ctx.save();
                this.#ctx.strokeStyle = "#ef4444";
                this.#ctx.lineWidth = 2;
                this.#ctx.setLineDash([6, 3]);
                this.#ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
                this.#ctx.restore();
            }
        });
    }

    clear() {
        this.#shapes = [];
        this.#currentShape = null;
        this.#isDrawing = false;
        this.#highlightedIndex = -1;
        this.redraw();
        this.#notify();
    }

    exportToCSV() {
        if (this.#shapes.length === 0) {
            alert("Немає об'єктів для збереження!");
            return;
        }

        const data = this.getShapesData();
        let csvContent = "type,x1,y1,x2,y2\n";

        data.forEach(item => {
            csvContent += `${item.rawType},${item.x1},${item.y1},${item.x2},${item.y2}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "shapes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    importFromCSV(csvText) {
        const lines = csvText.trim().split("\n");
        if (lines.length <= 1) return;

        const mapClass = {
            PointShape, LineShape, RectShape, EllipseShape, LineOOShape, CubeShape
        };

        this.#shapes = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const [type, x1, y1, x2, y2] = line.split(",");
            const ShapeClass = mapClass[type];

            if (ShapeClass) {
                const shape = new ShapeClass();
                shape.setCoords(x1, y1, x2, y2);
                this.#shapes.push(shape);
            }
        }

        this.#highlightedIndex = -1;
        this.redraw();
        this.#notify();
    }

    destroy() {
        this.#abortController.abort();
        this.#shapes = [];
        this.#onChangeCallbacks = [];
        this.#currentShape = null;
        this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        MyEditor.#instance = null;
    }
}