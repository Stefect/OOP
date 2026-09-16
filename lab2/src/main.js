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
});
