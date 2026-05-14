const WebSocket = require("ws");
const ChildBot = require("./childBot");

const {
    loadJSON,
    saveJSON
} = require("./storage");

let socket;
let CHILD_BOTS = [];

// =========================
// PACKET ID
// =========================
function generatePacketID() {
    return "BOT-" + Date.now();
}

// =========================
// STATUS SENDER (UI SAFE)
// =========================
function sendStatus(message, type = "info") {

    console.log("[STATUS]", message);

    const payload = {
        type: "bot_status",
        message,
        statusType: type,
        count: CHILD_BOTS.length
    };

    if (global.uiSocket && global.uiSocket.readyState === 1) {
        global.uiSocket.send(JSON.stringify(payload));
    }
}

// =========================
// START MAIN BOT
// =========================
async function start(username, password) {

    return new Promise((resolve) => {

        try {

            socket = new WebSocket("wss://chatp.net:5333/server");

            let finished = false;

            // =========================
            // CONNECT
            // =========================
            socket.on("open", () => {

                console.log("Main Bot Connected");

                socket.send(JSON.stringify({
                    handler: "login",
                    username,
                    password,
                    id: generatePacketID()
                }));

            });

            // =========================
            // MESSAGE
            // =========================
            socket.on("message", async (data) => {

                try {

                    const msg = JSON.parse(data);

                    // LOGIN SUCCESS
                    if (
                        msg.handler === "login_event" &&
                        msg.type === "success"
                    ) {

                        sendStatus("Main bot logged in", "success");

                        if (!finished) {
                            finished = true;
                            resolve({
                                success: true,
                                message: "Login Success"
                            });
                        }
                    }

                    // LOGIN FAILED
                    if (
                        msg.handler === "login_event" &&
                        (msg.type === "failed" || msg.type === "error")
                    ) {

                        sendStatus("Main bot login failed", "error");

                        if (!finished) {
                            finished = true;
                            resolve({
                                success: false,
                                message: "Wrong Credentials"
                            });
                        }
                    }

                    // PRIVATE MESSAGE
                    if (msg.handler === "chat_message") {
                        handlePrivateMessage(msg);
                    }

                } catch (err) {
                    console.log("MAINBOT PARSE ERROR:", err);
                }

            });

            socket.on("error", (err) => {
                console.log("MAINBOT ERROR:", err);

                if (!finished) {
                    finished = true;
                    resolve({
                        success: false,
                        message: "Socket Error"
                    });
                }
            });

            socket.on("close", () => {
                console.log("MAINBOT CLOSED");
            });

            // TIMEOUT
            setTimeout(() => {
                if (!finished) {
                    finished = true;
                    resolve({
                        success: false,
                        message: "Login Timeout"
                    });
                }
            }, 15000);

            // LOAD SAVED BOTS AFTER CONNECT
            loadSavedBots();

        } catch (err) {
            console.log("MAINBOT CRASH:", err);

            resolve({
                success: false,
                message: "Server Error"
            });
        }

    });
}

// =========================
// PRIVATE MESSAGE HANDLER
// =========================
async function handlePrivateMessage(msg) {

    if (!msg.body) return;

    const from = msg.from;
    const body = msg.body.trim();

    console.log("PM:", body);

    // HELP
    if (body.toLowerCase() === "help") {

        return sendPrivate(from,
`SERVER BOT GUIDE

Request ChildBot:
j/room#username#password

Example:
j/MyRoom#child1#pass123`
        );
    }

    // CREATE CHILD BOT
    if (body.startsWith("j/")) {
        return createChildBot(from, body);
    }
}

// =========================
// CREATE CHILD BOT
// =========================
async function createChildBot(owner, command) {

    const data = command.substring(2).split("#");

    const room = data[0];
    const username = data[1];
    const password = data[2];

    if (!room || !username || !password) {
        return sendPrivate(owner, "Invalid format.");
    }

    let bots = loadJSON("./storage/bots.json", []);

    if (bots.find(x => x.room === room)) {
        return sendPrivate(owner, "Room already has bot.");
    }

    const botConfig = {
        room,
        username,
        password,
        owner,
        welcome: true,
        quiz: true
    };

    bots.push(botConfig);
    saveJSON("./storage/bots.json", bots);

    sendStatus(`Creating ChildBot: ${username}`, "info");

    try {

        const result = await ChildBot.start(botConfig);

        // TRACK BOT
        if (result.success) {
            CHILD_BOTS.push(username);
        }

        sendStatus(
            `ChildBot ${username} => ${result.success ? "CONNECTED" : "FAILED"}`,
            result.success ? "success" : "error"
        );

        sendPrivate(owner,
`ChildBot Result:
User: ${username}
Room: ${room}
Status: ${result.success ? "CONNECTED" : "FAILED"}`
        );

    } catch (err) {

        sendStatus(`ChildBot ERROR: ${username}`, "error");

        sendPrivate(owner, "ChildBot crashed.");
    }
}

// =========================
// LOAD SAVED BOTS
// =========================
function loadSavedBots() {

    const bots = loadJSON("./storage/bots.json", []);

    bots.forEach(bot => {

        console.log("LOADING BOT:", bot.username);

        ChildBot.start(bot)
            .then(res => {

                if (res.success) {
                    CHILD_BOTS.push(bot.username);
                }

                sendStatus(
                    `Loaded bot ${bot.username}: ${res.success}`,
                    res.success ? "success" : "error"
                );

            })
            .catch(err => {
                console.log("LOAD BOT ERROR:", err);
            });

    });
}

// =========================
// SEND PRIVATE MESSAGE
// =========================
function sendPrivate(to, body) {

    if (!socket) return;

    socket.send(JSON.stringify({
        handler: "chat_message",
        type: "text",
        to,
        body,
        url: "",
        length: "0",
        id: generatePacketID()
    }));
}

module.exports = { start };
