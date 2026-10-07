"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("graphCanvas");
    const ctx = canvas.getContext("2d");
    const pointCountText = document.getElementById("pointCountText");
    const statusText = document.getElementById("statusText");

    const getPoints = async () => {
        try {
            const text = await navigator.clipboard.readText();
            return JSON.parse(text);
        } catch {
            const fallback = localStorage.getItem("lab6_clipboard_data");
            return fallback ? JSON.parse(fallback) : [];
        }
    };

    async function drawGraph() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        const points = await getPoints();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!points?.length) {
            pointCountText.textContent = "Немає даних у буфері";
            return;
        }

        const pts = [...points].sort((a, b) => a.x - b.x);
        pointCountText.textContent = `Точок на графіку: ${pts.length}`;

        const pad = 50, w = canvas.width - pad * 2, h = canvas.height - pad * 2;
        const xVals = pts.map(p => p.x), yVals = pts.map(p => p.y);

        let minX = Math.min(...xVals), maxX = Math.max(...xVals);
        let minY = Math.min(...yVals), maxY = Math.max(...yVals);
        if (minX === maxX) maxX += 1;
        if (minY === maxY) maxY += 1;

        const toPxX = (x) => pad + ((x - minX) / (maxX - minX)) * w;
        const toPxY = (y) => (canvas.height - pad) - ((y - minY) / (maxY - minY)) * h;

        ctx.save();

        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.moveTo(pad, canvas.height - pad); ctx.lineTo(canvas.width - pad + 20, canvas.height - pad); // X
        ctx.moveTo(pad, pad - 20); ctx.lineTo(pad, canvas.height - pad); // Y
        ctx.stroke();

        ctx.fillStyle = "#374151"; ctx.font = "12px sans-serif";
        ctx.fillText("X", canvas.width - pad + 25, canvas.height - pad + 4);
        ctx.fillText("Y", pad - 4, pad - 25);

        ctx.beginPath();
        ctx.strokeStyle = "#0078d4";
        ctx.lineWidth = 2;
        pts.forEach((p, i) => i === 0 ? ctx.moveTo(toPxX(p.x), toPxY(p.y)) : ctx.lineTo(toPxX(p.x), toPxY(p.y)));
        ctx.stroke();

        pts.forEach((p) => {
            const px = toPxX(p.x), py = toPxY(p.y);
            ctx.beginPath();
            ctx.fillStyle = "#ef4444";
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#111827";
            ctx.font = "10px sans-serif";
            ctx.fillText(`(${p.x}, ${p.y})`, px + 6, py - 6);
        });

        ctx.restore();
        statusText.textContent = "Графік оновлено";
    }

    window.addEventListener("resize", drawGraph);
    window.addEventListener("storage", (e) => e.key === "lab6_data_ready" && drawGraph());
    
    drawGraph();
});