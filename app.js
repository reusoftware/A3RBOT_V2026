const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

const MainBot = require("./bots/mainBot");

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({
    server
});

// =========================
// GLOBAL UI SOCKET
// =========================

global.uiSocket = null;

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());

app.use(express.static(
    path.join(__dirname, "public")
));

// =========================
// WEBSOCKET FOR LIVE LOGS
// =========================

wss.on("connection", (ws) => {

    console.log("WEB UI CONNECTED");

    global.uiSocket = ws;

    ws.on("close", () => {

        console.log("WEB UI CLOSED");

        global.uiSocket = null;

    });

});

// =========================
// START MAINBOT
// =========================

app.post("/startbot", async(req, res) => {

    try {

        const {
            username,
            password
        } = req.body;

        console.log(
            "START BOT REQUEST:",
            username
        );

        const result =
            await MainBot.start(
                username,
                password
            );

        res.json(result);

    } catch(err) {

        console.log(err);

        res.json({
            success: false,
            message: "Server Error"
        });

    }

});

// =========================
// START SERVER
// =========================

const PORT =
    process.env.PORT || 3000;

server.listen(PORT, () => {

    console.log(
        "SERVER RUNNING:",
        PORT
    );

});
