document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("pointsTableBody");
    const footerInfo = document.getElementById("footerInfo");
    const statusBadge = document.getElementById("statusBadge");

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    async function generateAndExportPoints() {
        const rawParams = localStorage.getItem("lab6_params");
        if (!rawParams) return;

        const params = JSON.parse(rawParams);
        const { nPoint, xMin, xMax, yMin, yMax } = params;

        const points = [];
        tableBody.innerHTML = "";

        for (let i = 0; i < nPoint; i++) {
            const x = getRandomInt(xMin, xMax);
            const y = getRandomInt(yMin, yMax);
            points.push({ x, y });

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${i + 1}</td>
                <td><b>${x}</b></td>
                <td><b>${y}</b></td>
            `;
            tableBody.appendChild(tr);
        }

        const clipboardText = JSON.stringify(points);

        try {
            await navigator.clipboard.writeText(clipboardText);
            statusBadge.textContent = "Скопійовано в Clipboard";
            statusBadge.style.background = "#dcfce7";
            statusBadge.style.color = "#166534";
        } catch (err) {
            localStorage.setItem("lab6_clipboard_data", clipboardText);
            statusBadge.textContent = "Збережено у пам'ять";
            statusBadge.style.background = "#fef3c7";
            statusBadge.style.color = "#92400e";
        }

        footerInfo.textContent = `Точок: ${nPoint} | Діапазон X:[${xMin}..${xMax}], Y:[${yMin}..${yMax}]`;


        localStorage.setItem("lab6_data_ready", Date.now().toString());
    }

    generateAndExportPoints();

    window.addEventListener("storage", (e) => {
        if (e.key === "lab6_params" || e.key === "lab6_trigger_object2") {
            generateAndExportPoints();
        }
    });
});