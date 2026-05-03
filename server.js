const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("✅ A3R BOT IS LIVE ON RAILWAY");
});

const server = http.createServer(app);

// IMPORTANT: attach WS to SAME server
const wss = new WebSocket.Server({ server, path: "/server" });

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.handler === "3rd_login") {
                const { username, password, api_key } = data.payload;

                if (api_key !== "xYn86hjOpJk$") {
                    ws.send(JSON.stringify({
                        handler: "login_result",
                        ok: false,
                        message: "Invalid API key"
                    }));
                    return;
                }

                ws.send(JSON.stringify({
                    handler: "login_result",
                    ok: true,
                    username
                }));
            }
        } catch (e) {
            console.log("Error:", e.message);
        }
    });
});

// 🔥 CRITICAL: Railway PORT FIX
const PORT = process.env.PORT;

if (!PORT) {
    console.log("PORT missing - using fallback 8080");
}

server.listen(PORT || 8080, () => {
    console.log("A3R BOT RUNNING ON PORT", PORT || 8080);
});
