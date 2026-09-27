export class MenuManager {
    #trigger;
    #dropdown;
    #options;
    #currentShapeType;
    #onSelectCallback;

    constructor({ triggerId, dropdownId, onSelect }) {
        this.#trigger = document.getElementById(triggerId);
        this.#dropdown = document.getElementById(dropdownId);
        this.#options = this.#dropdown.querySelectorAll(".menu-option");
        this.#currentShapeType = "RECTANGLE";
        this.#onSelectCallback = onSelect;

        this.#initEvents();
        this.updateCheckmarks();
    }

    #initEvents() {
        this.#trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            this.#dropdown.classList.toggle("visible");
            this.#trigger.classList.toggle("active");
        });

        this.#options.forEach(option => {
            option.addEventListener("click", () => {
                const selectedType = option.dataset.shape;
                this.#currentShapeType = selectedType;
                this.updateCheckmarks();
                this.close();

                if (typeof this.#onSelectCallback === "function") {
                    this.#onSelectCallback(selectedType);
                }
            });
        });

        window.addEventListener("click", () => this.close());
    }

    updateCheckmarks() {
        this.#options.forEach(option => {
            const checkSpan = option.querySelector(".check");
            if (option.dataset.shape === this.#currentShapeType) {
                checkSpan.textContent = "✓";
            } else {
                checkSpan.textContent = "";
            }
        });
    }

    close() {
        this.#dropdown.classList.remove("visible");
        this.#trigger.classList.remove("active");
    }

    get currentShapeType() {
        return this.#currentShapeType;
    }
}