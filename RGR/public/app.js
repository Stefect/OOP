import { AppController } from "./appController.js";

const CANVAS = { width: 2000, height: 2000 };
const $ = (id) => document.getElementById(id);
const canvas = $("canvas");
const ctx = canvas.getContext("2d");
const DPR = window.devicePixelRatio || 1;
canvas.width = CANVAS.width * DPR;
canvas.height = CANVAS.height * DPR;
canvas.style.width = `${CANVAS.width}px`;
canvas.style.height = `${CANVAS.height}px`;
ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = "high";

const app = new AppController(canvas, ctx);
app.bindEvents();
app.start();