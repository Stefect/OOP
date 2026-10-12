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

const editor = new Editor();

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
  }
  return raw ? JSON.parse(raw) : {};
}

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/document") {
    return sendJson(res, 200, editor.document.toJSON());
  }

  if (req.method === "PUT" && url.pathname === "/api/document") {
    try {
      editor.replaceDocument(await readJsonBody(req));
      return sendJson(res, 200, editor.document.toJSON());
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (req.method === "POST" && url.pathname === "/api/command") {
    const { line } = await readJsonBody(req);
    try {
      const message = await editor.execute(String(line ?? ""));
      return sendJson(res, 200, { message });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  return sendJson(res, 404, { error: "Не знайдено" });
}

async function handleStatic(req, res, url) {
  if (req.method !== "GET") {
    res.writeHead(405);
    return res.end();
  }

  const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
  const filePath = normalize(join(PUBLIC_DIR, name));
  if (!filePath.startsWith(PUBLIC_DIR)) {
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

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
    } else {
      await handleStatic(req, res, url);
    }
  } catch (error) {
    sendJson(res, 500, { error: error.message });
  }
}).listen(PORT, () => {
  console.log(`Графічний редактор запущено: http://localhost:${PORT}`);
});
