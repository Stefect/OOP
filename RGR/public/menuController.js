export class MenuController {
  constructor(app) {
    this.app = app;
  }

  closeMenus() {
    document.querySelectorAll(".menu").forEach((menu) => menu.classList.remove("open"));
  }

  bind() {
    document.querySelectorAll(".menu-trigger").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        const menu = trigger.closest(".menu");
        const wasOpen = menu.classList.contains("open");
        this.closeMenus();
        if (!wasOpen) menu.classList.add("open");
      });
    });
    window.addEventListener("click", () => this.closeMenus());

    const action = (name, handler) => {
      const el = document.querySelector(`[data-action="${name}"]`);
      if (el) el.addEventListener("click", handler);
    };

    action("new", () => this.app.newScene());
    action("open", () => { this.closeMenus(); document.getElementById("fileInput").click(); });
    action("save", () => { this.closeMenus(); document.getElementById("saveBtn").click(); });
    action("saveAs", () => this.app.saveAsDownload());
    action("export", () => { this.closeMenus(); document.getElementById("exportBtn").click(); });
    action("about", () => { this.closeMenus(); alert("Векторний графічний редактор\nЛабораторна/РГР з ООП\nВаріант 4"); });

    const fileInput = document.getElementById("fileInput");
    if (fileInput) {
      fileInput.addEventListener("change", (event) => {
        const [file] = event.target.files || [];
        this.app.openSelectedFile(file);
        event.target.value = "";
      });
    }

    const saveBtn = document.getElementById("saveBtn");
    if (saveBtn) saveBtn.addEventListener("click", () => this.app.serverSync.fileOperation(`save ${this.app.fileName()}`));

    const loadBtn = document.getElementById("loadBtn");
    if (loadBtn) {
      loadBtn.addEventListener("click", async () => {
        if (await this.app.serverSync.fileOperation(`load ${this.app.fileName()}`)) {
          await this.app.serverSync.load();
        }
      });
    }

    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const name = this.app.fileName().replace(/\.json$/i, "") + ".svg";
        this.app.serverSync.fileOperation(`export ${name}`);
      });
    }
  }
}