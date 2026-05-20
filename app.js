process.on("uncaughtException", (err) => {
    console.log("[CRASH PREVENTED]", err.message);
});

process.on("unhandledRejection", (err) => {
    console.log("[PROMISE ERROR]", err);
});
//======

const {
    loadJSON
} = require("./storage");

const ChildBot =
    require("./bots/childBot");
//=======
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

server.listen(PORT, async() => {

    console.log(
        "SERVER RUNNING:",
        PORT
    );

    await restoreBots();

});
// =====================================
// AUTO RESTORE CHILDBOTS
// =====================================

async function restoreBots() {

    try {

        const bots =
            loadJSON(
                "./storage/bots.json",
                []
            );

        console.log(
            "[RESTORE BOTS]",
            bots.length
        );

        for (const bot of bots) {

            try {

                await ChildBot.start(bot);

                console.log(
                    "[RESTORED]",
                    bot.username
                );

            } catch (err) {

                console.log(
                    "[RESTORE ERROR]",
                    err.message
                );

            }

        }

    } catch (err) {

        console.log(
            "[RESTORE FAILED]",
            err.message
        );

    }

}
    console.log(
        "SERVER RUNNING:",
        PORT
    );

});
