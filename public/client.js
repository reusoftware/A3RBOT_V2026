const loginBtn = document.getElementById("loginBtn");
const statusText = document.getElementById("status");
const logs = document.getElementById("logs");

let ws;

// =========================
// LOGIN
// =========================

loginBtn.addEventListener("click", async () => {

    const username =
        document.getElementById("username").value;

    const password =
        document.getElementById("password").value;

    statusText.innerHTML = "Connecting...";

    const response = await fetch("/startbot", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            password
        })
    });

    const result = await response.json();

    if (result.success) {

        statusText.innerHTML = "Online";
        addLog("Main Bot Connected", "success");

        // 🔥 START LIVE MONITOR
        connectLive();

    } else {

        statusText.innerHTML = "Login Failed";
        addLog(result.message || "Login failed", "error");
    }

});

// =========================
// LIVE SOCKET CONNECTION
// =========================

function connectLive() {

    ws = new WebSocket(
        location.origin.replace("http", "ws")
    );

    ws.onopen = () => {
        addLog("Live monitor connected", "info");
    };

    ws.onmessage = (event) => {

        try {

            const data = JSON.parse(event.data);

            // =========================
            // BOT STATUS (MAIN + CHILD)
            // =========================
            if (data.type === "bot_status") {

                addLog(data.message, data.statusType);

                if (data.count !== undefined) {

                    document.getElementById("childCount").innerText =
                        data.count;
                }
            }

            // =========================
            // QUIZ FEEDBACK (OPTIONAL)
            // =========================
            if (data.type === "quiz") {

                addLog(data.message, "info");
            }

            // =========================
            // MASTER ACTION LOGS
            // =========================
            if (data.type === "master") {

                addLog("[MASTER] " + data.message, "info");
            }

        } catch (err) {
            console.log("WS ERROR", err);
        }

    };

    ws.onclose = () => {
        addLog("Live monitor disconnected", "error");
    };
}

// =========================
// LOG FUNCTION
// =========================

function addLog(text, type = "info") {

    const p = document.createElement("p");

    p.innerText = text;

    p.className = type;

    logs.appendChild(p);

    logs.scrollTop = logs.scrollHeight;
}
