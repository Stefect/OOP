"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("paramsForm");
    const wins = { obj2: null, obj3: null };

    const syncWin = (key, url, title, opts) => {
        if (!wins[key] || wins[key].closed) {
            wins[key] = window.open(url, title, opts);
        } else {
            wins[key].focus();
        }
    };

    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const params = Object.fromEntries(
            [...new FormData(form)].map(([k, v]) => [k, parseInt(v, 10) || 0])
        );

        localStorage.setItem("lab6_params", JSON.stringify(params));

        syncWin("obj2", "../Object2/index.html", "Object2_Win", "width=400,height=500,left=100,top=100");
        localStorage.setItem("lab6_trigger_object2", Date.now().toString());

        syncWin("obj3", "../Object3/index.html", "Object3_Win", "width=600,height=500,left=520,top=100");
    });

    window.addEventListener("beforeunload", () => {
        Object.values(wins).forEach(w => w && !w.closed && w.close());
    });
});