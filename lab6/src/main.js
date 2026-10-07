import { MenuManager } from "./ui/MenuManager.js";
import { MyEditor } from "./editor/MyEditor.js";
import { MyTable } from "./ui/MyTable.js";

document.addEventListener("DOMContentLoaded", () => {
    let editor = MyEditor.getInstance("editorCanvas");

    const tableWindow = new MyTable({
        windowId: "tableWindow",
        tableBodyId: "tableBody",
        closeBtnId: "closeTableBtn",
        onRowSelect: (index) => {
            if (editor) editor.highlightShape(index);
        },
        onRowDelete: (index) => {
            if (editor) editor.removeShape(index);
        }
    });

    editor.subscribe((shapesData) => {
        tableWindow.update(shapesData);
    });

    const fileTrigger = document.getElementById("fileMenuTrigger");
    const fileDropdown = document.getElementById("fileDropdown");
    const clearBtn = document.getElementById("clearCanvasBtn");
    const tableMenuTrigger = document.getElementById("tableMenuTrigger");
    const saveCsvBtn = document.getElementById("saveCsvBtn");
    const loadCsvBtn = document.getElementById("loadCsvBtn");
    const csvFileInput = document.getElementById("csvFileInput");

    const closeFileMenu = () => {
        if (fileDropdown && fileTrigger) {
            fileDropdown.classList.remove("visible");
            fileTrigger.classList.remove("active");
        }
    };

    const menu = new MenuManager({
        triggerId: "objectsMenuTrigger",
        dropdownId: "objectsDropdown",
        toolbarId: "mainToolbar",
        titleBarId: "windowTitleBar",
        onSelect: (type) => {
            if (editor) {
                editor.setShapeType(type);
            }
        }
    });

    editor.setShapeType(menu.currentShapeType);

    if (tableMenuTrigger) {
        tableMenuTrigger.addEventListener("click", () => {
            closeFileMenu();
            menu.close();
            tableWindow.toggle();
        });
    }

    if (saveCsvBtn) {
        saveCsvBtn.addEventListener("click", () => {
            closeFileMenu();
            editor.exportToCSV();
        });
    }

    if (loadCsvBtn && csvFileInput) {
        loadCsvBtn.addEventListener("click", () => {
            closeFileMenu();
            csvFileInput.click();
        });

        csvFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                editor.importFromCSV(event.target.result);
                csvFileInput.value = "";
            };
            reader.readAsText(file);
        });
    }

    const objectsTrigger = document.getElementById("objectsMenuTrigger");
    if (objectsTrigger) {
        objectsTrigger.addEventListener("click", () => {
            closeFileMenu();
        });
    }

    if (fileTrigger && fileDropdown) {
        fileTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.close();
            fileDropdown.classList.toggle("visible");
            fileTrigger.classList.toggle("active");
        });

        window.addEventListener("click", () => closeFileMenu());
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (editor) {
                editor.clear();
            }
            closeFileMenu();
        });
    }

    const aboutBtn = document.getElementById("aboutTrigger");
    if (aboutBtn) {
        aboutBtn.addEventListener("click", () => {
            closeFileMenu();
            menu.close();
            alert("Лабораторна робота №5\nТема: Розробка багатовіконного інтерфейсу користувача\nВаріант: 4 (класична реалізація Singleton)");
        });
    }

    window.addEventListener("beforeunload", () => {
        if (tableWindow) {
            tableWindow.hide();
        }
        if (editor) {
            editor.destroy();
            editor = null;
        }
    });
});