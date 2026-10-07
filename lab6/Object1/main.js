document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startBtn");

    let object2Window = null;
    let object3Window = null;

    startBtn.addEventListener("click", () => {
        const params = {
            nPoint: parseInt(document.getElementById("nPoint").value, 10) || 10,
            xMin: parseInt(document.getElementById("xMin").value, 10) || 0,
            xMax: parseInt(document.getElementById("xMax").value, 10) || 100,
            yMin: parseInt(document.getElementById("yMin").value, 10) || 0,
            yMax: parseInt(document.getElementById("yMax").value, 10) || 100
        };

        localStorage.setItem("lab6_params", JSON.stringify(params));

        if (!object2Window || object2Window.closed) {
            object2Window = window.open("../Object2/index.html", "Object2_Window", "width=400,height=500,left=100,top=100");
        } else {
            object2Window.focus();
            localStorage.setItem("lab6_trigger_object2", Date.now().toString());
        }

        if (!object3Window || object3Window.closed) {
            object3Window = window.open("../Object3/index.html", "Object3_Window", "width=600,height=500,left=520,top=100");
        } else {
            object3Window.focus();
        }
    });

    window.addEventListener("beforeunload", () => {
        if (object2Window && !object2Window.closed) object2Window.close();
        if (object3Window && !object3Window.closed) object3Window.close();
    });
});