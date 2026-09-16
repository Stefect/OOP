/**
 * Базовий абстрактний клас фігури
 */
export class Shape {
    // Приватні поля координат (інкапсуляція)
    #xs1;
    #ys1;
    #xs2;
    #ys2;

    constructor() {
        if (new.target === Shape) {
            throw new TypeError("Неможливо створити екземпляр абстрактного класу Shape.");
        }
        this.#xs1 = 0;
        this.#ys1 = 0;
        this.#xs2 = 0;
        this.#ys2 = 0;
    }

    setCoords(x1, y1, x2, y2) {
        this.#xs1 = Number(x1);
        this.#ys1 = Number(y1);
        this.#xs2 = Number(x2);
        this.#ys2 = Number(y2);
    }

    get coords() {
        return {
            x1: this.#xs1,
            y1: this.#ys1,
            x2: this.#xs2,
            y2: this.#ys2
        };
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    show(ctx) {
        throw new Error("Метод show() повинен бути реалізований у класі-нащадку.");
    }
}