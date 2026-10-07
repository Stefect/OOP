export class MyTable {
    #windowElem;
    #tableBody;
    #closeBtn;
    #onRowSelectCallback;
    #onRowDeleteCallback;
    #selectedIndex = -1;

    constructor({ windowId, tableBodyId, closeBtnId, onRowSelect, onRowDelete }) {
        this.#windowElem = document.getElementById(windowId);
        this.#tableBody = document.getElementById(tableBodyId);
        this.#closeBtn = document.getElementById(closeBtnId);

        this.#onRowSelectCallback = onRowSelect;
        this.#onRowDeleteCallback = onRowDelete;

        this.#initEvents();
    }

    #initEvents() {
        if (this.#closeBtn) {
            this.#closeBtn.addEventListener("click", () => this.hide());
        }

        if (this.#tableBody) {
            this.#tableBody.addEventListener("click", (e) => {
                const tr = e.target.closest("tr");
                if (!tr) return;

                const index = parseInt(tr.dataset.index, 10);

                if (e.target.classList.contains("delete-row-btn")) {
                    e.stopPropagation();
                    if (typeof this.#onRowDeleteCallback === "function") {
                        this.#onRowDeleteCallback(index);
                    }
                    return;
                }

                this.selectRow(index);
                if (typeof this.#onRowSelectCallback === "function") {
                    this.#onRowSelectCallback(index);
                }
            });
        }
    }

    update(shapesData) {
        if (!this.#tableBody) return;
        this.#tableBody.innerHTML = "";

        shapesData.forEach((shape, index) => {
            const tr = document.createElement("tr");
            tr.dataset.index = index;
            if (index === this.#selectedIndex) {
                tr.classList.add("selected-row");
            }

            tr.innerHTML = `
                <td>${shape.name}</td>
                <td>${shape.x1}</td>
                <td>${shape.y1}</td>
                <td>${shape.x2}</td>
                <td>${shape.y2}</td>
                <td style="text-align: center;">
                    <button class="delete-row-btn" title="Видалити фігуру">&times;</button>
                </td>
            `;

            this.#tableBody.appendChild(tr);
        });
    }

    selectRow(index) {
        this.#selectedIndex = index;
        if (!this.#tableBody) return;

        const rows = this.#tableBody.querySelectorAll("tr");
        rows.forEach((row) => {
            const rowIndex = parseInt(row.dataset.index, 10);
            row.classList.toggle("selected-row", rowIndex === index);
        });
    }

    show() {
        if (this.#windowElem) {
            this.#windowElem.style.display = "flex";
        }
    }

    hide() {
        if (this.#windowElem) {
            this.#windowElem.style.display = "none";
        }
    }

    toggle() {
        if (this.#windowElem) {
            const isHidden = getComputedStyle(this.#windowElem).display === "none";
            if (isHidden) {
                this.show();
            } else {
                this.hide();
            }
        }
    }
}