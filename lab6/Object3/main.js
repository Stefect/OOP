document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("graphCanvas");
    const ctx = canvas.getContext("2d");
    const pointCountText = document.getElementById("pointCountText");
    const statusText = document.getElementById("statusText");

    function resizeCanvas() {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
    }

    async function readPointsFromClipboard() {
        let rawData = "";

        try {
            rawData = await navigator.clipboard.readText();
        } catch (err) {
            rawData = localStorage.getItem("lab6_clipboard_data") || "";
        }

        if (!rawData) return [];

        try {
            const points = JSON.parse(rawData);
            return Array.isArray(points) ? points : [];
        } catch (e) {
            return [];
        }
    }

    async function drawGraph() {
        resizeCanvas();
        const points = await readPointsFromClipboard();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (points.length === 0) {
            pointCountText.textContent = "Немає даних у буфері";
            return;
        }

        const sortedPoints = [...points].sort((a, b) => a.x - b.x);

        pointCountText.textContent = `Точок на графіку: ${sortedPoints.length}`;

        const padding = 50;
        const w = canvas.width - padding * 2;
        const h = canvas.height - padding * 2;

        const xValues = sortedPoints.map(p => p.x);
        const yValues = sortedPoints.map(p => p.y);

        let minX = Math.min(...xValues);
        let maxX = Math.max(...xValues);
        let minY = Math.min(...yValues);
        let maxY = Math.max(...yValues);

        if (minX === maxX) maxX += 1;
        if (minY === maxY) maxY += 1;

        const toPixelX = (x) => padding + ((x - minX) / (maxX - minX)) * w;
        const toPixelY = (y) => (canvas.height - padding) - ((y - minY) / (maxY - minY)) * h;

        ctx.save();
        ctx.strokeStyle = "#9ca3af";
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding + 20, canvas.height - padding);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padding, padding - 20);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.stroke();

        ctx.fillStyle = "#374151";
        ctx.font = "12px sans-serif";
        ctx.fillText("X", canvas.width - padding + 25, canvas.height - padding + 4);
        ctx.fillText("Y", padding - 4, padding - 25);

        ctx.beginPath();
        ctx.strokeStyle = "#0078d4";
        ctx.lineWidth = 2;

        sortedPoints.forEach((p, index) => {
            const px = toPixelX(p.x);
            const py = toPixelY(p.y);

            if (index === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        });
        ctx.stroke();

        sortedPoints.forEach((p) => {
            const px = toPixelX(p.x);
            const py = toPixelY(p.y);

            // Точка
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

    window.addEventListener("storage", (e) => {
        if (e.key === "lab6_data_ready") {
            drawGraph();
        }
    });

    drawGraph();
});