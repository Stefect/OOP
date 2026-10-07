"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("tableBody");
    const footerInfo = document.getElementById("footerInfo");
    const badge = document.getElementById("statusBadge");

    const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    async function generatePoints() {
        const raw = localStorage.getItem("lab6_params");
        if (!raw) return;

        const { nPoint, xMin, xMax, yMin, yMax } = JSON.parse(raw);
        const points = Array.from({ length: nPoint }, () => ({
            x: rand(xMin, xMax),
            y: rand(yMin, yMax)
        }));

        tableBody.innerHTML = points.map((p, i) => `
            <tr><td>${i + 1}</td><td><b>${p.x}</b></td><td><b>${p.y}</b></td></tr>
        `).join("");

        const jsonStr = JSON.stringify(points);

        try {
            await navigator.clipboard.writeText(jsonStr);
            badge.textContent = "Скопійовано в Clipboard";
            badge.className = "badge ok";
        } catch {
            localStorage.setItem("lab6_clipboard_data", jsonStr);
            badge.textContent = "Збережено у пам'ять";
            badge.className = "badge warn";
        }

        footerInfo.textContent = `Точок: ${nPoint} | X:[${xMin}..${xMax}], Y:[${yMin}..${yMax}]`;
        localStorage.setItem("lab6_data_ready", Date.now().toString());
    }

    generatePoints();

    window.addEventListener("storage", (e) => {
        if (["lab6_params", "lab6_trigger_object2"].includes(e.key)) {
            generatePoints();
        }
    });
});