import { MenuManager } from "./ui/MenuManager.js";
import { MyEditor } from "./editor/MyEditor.js";

document.addEventListener("DOMContentLoaded", () => {
    const editor = new MyEditor("editorCanvas");

    const fileTrigger = document.getElementById("fileMenuTrigger");
    const fileDropdown = document.getElementById("fileDropdown");
    const clearBtn = document.getElementById("clearCanvasBtn");

    const closeFileMenu = () => {
        if (fileDropdown && fileTrigger) {
            fileDropdown.classList.remove("visible");
            fileTrigger.classList.remove("active");
        }
    };

    const menu = new MenuManager({
        triggerId: "objectsMenuTrigger",
        dropdownId: "objectsDropdown",
        onSelect: (type) => editor.setShapeType(type)
    });

    editor.setShapeType(menu.currentShapeType);

    const objectsTrigger = document.getElementById("objectsMenuTrigger");
    if (objectsTrigger) {
        objectsTrigger.addEventListener("click", () => {
            closeFileMenu();
        });
    }

    if (fileTrigger && fileDropdown) {
        fileTrigger.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.close(); // закриваємо меню "Об'єкти"
            fileDropdown.classList.toggle("visible");
            fileTrigger.classList.toggle("active");
        });

        window.addEventListener("click", () => closeFileMenu());
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            editor.clear();
            closeFileMenu();
        });
    }

    const aboutBtn = document.getElementById("aboutTrigger");
    if (aboutBtn) {
        aboutBtn.addEventListener("click", () => {
            closeFileMenu();
            menu.close();
            alert("Лабораторна робота №2\nТема: Графічний редактор об'єктів\nВаріант: Ж = 4");
        });
    }
});