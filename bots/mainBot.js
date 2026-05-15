const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket;
let CHILD_BOTS = [];

function sendStatus(message, type = "info") {

    const payload = {
        type: "bot_status",
        message,
        statusType: type,
        count: CHILD_BOTS.length
    };

    if (global.uiSocket?.readyState === 1) {
        global.uiSocket.send(JSON.stringify(payload));
    }

    console.log("[STATUS]", message);
}

function start(username, password) {

    return new Promise((resolve) => {

        socket = new WebSocket("wss://chatp.net:5333/server");

        let done = false;

        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username,
                password,
                id: Date.now().toString()
            }));
        });

        socket.on("message", async (data) => {

            let msg;
            try {
                msg = JSON.parse(data);
            } catch { return; }

            if (msg.handler === "login_event") {

                if (msg.type === "success") {

                    sendStatus("Main Bot Online", "success");

                    if (!done) {
                        done = true;
                        resolve({ success: true });
                    }
                }

                if (msg.type === "failed") {

                    sendStatus("Login Failed", "error");

                    if (!done) {
                        done = true;
                        resolve({ success: false });
                    }
                }
            }

            if (msg.handler === "chat_message") {
                handlePM(msg);
            }
        });

        loadSavedBots();

        setTimeout(() => {
            if (!done) resolve({ success: false });
        }, 15000);
    });
}

function handlePM(msg) {

    const from = msg.from;
    const body = (msg.body || "").trim();

    if (body === "help") {

        socket.send(JSON.stringify({
            handler: "chat_message",
            type: "text",
            to: from,
            body: "j/room#user#pass",
            id: Date.now().toString()
        }));
    }

    if (body.startsWith("j/")) {
        createBot(from, body);
    }
}

async function createBot(owner, cmd) {

    const [room, user, pass] = cmd.substring(2).split("#");

    const bot = { room, username: user, password: pass, owner };

    sendStatus("Creating " + user, "info");

    const res = await ChildBot.start(bot);

    if (res.success) CHILD_BOTS.push(user);

    sendStatus("ChildBot " + user + " " + res.success, res.success ? "success" : "error");

    socket.send(JSON.stringify({
        handler: "chat_message",
        type: "text",
        to: owner,
        body: res.success ? "ChildBot OK" : "ChildBot Failed",
        id: Date.now().toString()
    }));
}

function loadSavedBots() {

    const bots = loadJSON("./storage/bots.json", []);

    bots.forEach(async b => {
        const res = await ChildBot.start(b);
        if (res.success) CHILD_BOTS.push(b.username);
    });
}

module.exports = { start };
