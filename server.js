const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("✅ A3R BOT IS LIVE ON RAILWAY");
});

const server = http.createServer(app);

const wss = new WebSocket.Server({ server, path: "/server" });

wss.on("connection", (ws) => {
    console.log("Client connected");

    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg.toString());

            if (data.handler === "3rd_login") {
                const { username, password, api_key } = data.payload;

                if (api_key !== "xYn86hjOpJk$") {
                    return ws.send(JSON.stringify({
                        handler: "login_result",
                        ok: false,
                        message: "Invalid API key"
                    }));
                }

                return ws.send(JSON.stringify({
                    handler: "login_result",
                    ok: true,
                    username
                }));
            }
        } catch (err) {
            console.log("WS Error:", err.message);
        }
    });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log("A3R BOT RUNNING ON PORT", PORT);
});
