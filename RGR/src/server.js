import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { Editor } from "./Editor.js";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PUBLIC_DIR = join(ROOT, "public");
const PORT = Number(process.env.PORT) || 3000;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

export class HttpServer {
  #editor;
  #port;
  #publicDir;

  constructor(editor = new Editor(), port = PORT, publicDir = PUBLIC_DIR) {
    this.#editor = editor;
    this.#port = port;
    this.#publicDir = publicDir;
  }

  async #sendJson(res, status, body) {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  }

  async #readJsonBody(req) {
    let raw = "";
    for await (const chunk of req) {
      raw += chunk;
    }
    return raw ? JSON.parse(raw) : {};
  }

  async #handleApi(req, res, url) {
    if (req.method === "GET" && url.pathname === "/api/document") {
      return this.#sendJson(res, 200, this.#editor.documentToJSON());
    }

    if (req.method === "PUT" && url.pathname === "/api/document") {
      try {
        this.#editor.replaceDocument(await this.#readJsonBody(req));
        return this.#sendJson(res, 200, this.#editor.documentToJSON());
      } catch (error) {
        return this.#sendJson(res, 400, { error: error.message });
      }
    }

    if (req.method === "POST" && url.pathname === "/api/command") {
      const { line } = await this.#readJsonBody(req);
      try {
        const message = await this.#editor.execute(String(line ?? ""));
        return this.#sendJson(res, 200, { message });
      } catch (error) {
        return this.#sendJson(res, 400, { error: error.message });
      }
    }

    return this.#sendJson(res, 404, { error: "Не знайдено" });
  }

  async #handleStatic(req, res, url) {
    if (req.method !== "GET") {
      res.writeHead(405);
      return res.end();
    }

    const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const filePath = normalize(join(this.#publicDir, name));
    if (!filePath.startsWith(this.#publicDir)) {
      res.writeHead(403);
      return res.end();
    }

    try {
      const content = await readFile(filePath);
      res.writeHead(200, {
        "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Не знайдено");
    }
  }

  start() {
    createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname.startsWith("/api/")) {
          await this.#handleApi(req, res, url);
        } else {
          await this.#handleStatic(req, res, url);
        }
      } catch (error) {
        await this.#sendJson(res, 500, { error: error.message });
      }
    }).listen(this.#port, () => {
      console.log(`Графічний редактор запущено: http://localhost:${this.#port}`);
    });
  }
}

const server = new HttpServer();
server.start();