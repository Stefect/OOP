import { MenuManager } from "./ui/MenuManager.js";
import { MyEditor } from "./editor/MyEditor.js";

document.addEventListener("DOMContentLoaded", () => {
    const editor = new MyEditor("editorCanvas");
    const menu = new MenuManager({
        triggerId: "objectsMenuTrigger",
        dropdownId: "objectsDropdown",
        onSelect: (type) => editor.setShapeType(type)
    });

    editor.setShapeType(menu.currentShapeType);
    const fileTrigger = document.getElementById("fileMenuTrigger");
    const fileDropdown = document.getElementById("fileDropdown");
    const clearBtn = document.getElementById("clearCanvasBtn");

    if (fileTrigger && fileDropdown) {
        fileTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            fileDropdown.classList.toggle("visible");
            fileTrigger.classList.toggle("active");
            menu.close(); // закриваємо меню об'єктів, якщо воно було відкрите
        });

        window.addEventListener("click", () => {
            fileDropdown.classList.remove("visible");
            fileTrigger.classList.remove("active");
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            editor.clear();
            fileDropdown.classList.remove("visible");
            fileTrigger.classList.remove("active");
        });
    }
    const aboutBtn = document.getElementById("aboutTrigger");
    if (aboutBtn) {
        aboutBtn.addEventListener("click", () => {
            alert("Лабораторна робота №2\nВаріант: Ж = 4");
        });
    }
});