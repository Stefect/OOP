export class MenuManager {
    #trigger;
    #dropdown;
    #options;
    #toolbarButtons;
    #titleBar;
    #currentShapeType;
    #onSelectCallback;

    #typeNames = {
        POINT: "Крапка",
        LINE: "Лінія",
        RECTANGLE: "Прямокутник",
        ELLIPSE: "Еліпс",
        LINEOO: "Лінія з кружечками",
        CUBE: "Каркас куба"
    };

    constructor({ triggerId, dropdownId, toolbarId, titleBarId, onSelect }) {
        this.#trigger = document.getElementById(triggerId);
        this.#dropdown = document.getElementById(dropdownId);
        this.#options = this.#dropdown.querySelectorAll(".menu-option");
        
        const toolbar = document.getElementById(toolbarId);
        this.#toolbarButtons = toolbar ? toolbar.querySelectorAll(".toolbar-btn") : [];
        this.#titleBar = document.getElementById(titleBarId);

        this.#currentShapeType = "RECTANGLE";
        this.#onSelectCallback = onSelect;

        this.#initEvents();
        this.updateUI();
    }

    #initEvents() {
        this.#trigger.addEventListener("click", (e) => {
            e.stopPropagation();
            this.#dropdown.classList.toggle("visible");
            this.#trigger.classList.toggle("active");
        });

        this.#options.forEach(option => {
            option.addEventListener("click", () => {
                this.selectType(option.dataset.shape);
                this.close();
            });
        });

        this.#toolbarButtons.forEach(btn => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                this.selectType(btn.dataset.shape);
            });
        });

        window.addEventListener("click", () => this.close());
    }

    selectType(type) {
        if (!type || !this.#typeNames[type]) return;
        this.#currentShapeType = type;
        this.updateUI();

        if (typeof this.#onSelectCallback === "function") {
            this.#onSelectCallback(type);
        }
    }

    updateUI() {
        this.#options.forEach(option => {
            const checkSpan = option.querySelector(".check");
            if (option.dataset.shape === this.#currentShapeType) {
                checkSpan.textContent = "✓";
            } else {
                checkSpan.textContent = "";
            }
        });

        this.#toolbarButtons.forEach(btn => {
            btn.classList.toggle("active", btn.dataset.shape === this.#currentShapeType);
        });

        const name = this.#typeNames[this.#currentShapeType];
        if (this.#titleBar) {
            this.#titleBar.textContent = `My Prog — ${name}`;
        }
        document.title = `Lab 4 — ${name}`;
    }

    close() {
        this.#dropdown.classList.remove("visible");
        this.#trigger.classList.remove("active");
    }

    get currentShapeType() {
        return this.#currentShapeType;
    }
}