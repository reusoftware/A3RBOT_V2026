const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/server" });

let clients = {};

wss.on("connection", (ws) => {
    console.log("Bot connected");

    ws.on("message", (msg) => {
        const data = JSON.parse(msg);

        // ===== LOGIN HANDLER (like your 3rd_login) =====
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

            // fake auth (replace with DB later)
            if (username && password) {
                clients[username] = ws;

                ws.send(JSON.stringify({
                    handler: "login_result",
                    ok: true,
                    username: username
                }));
            } else {
                ws.send(JSON.stringify({
                    handler: "login_result",
                    ok: false,
                    message: "Invalid credentials"
                }));
            }
        }
    });

    ws.on("close", () => {
        console.log("Bot disconnected");
    });
});

server.listen(process.env.PORT || 8080, () => {
    console.log("A3R WebSocket Bot Running");
});
