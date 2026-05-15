const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket;
let CHILD_BOTS = [];

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
if (msg.handler === "bot_status" && msg.type === "child_ready") {

    console.log("[CHILDBOT READY]", msg.username);

    sendStatus(
        `ChildBot ONLINE: ${msg.username} in ${msg.room}`,
        "success"
    );

    CHILD_BOTS.push(msg.username);

    sendPrivate(
        msg.owner || "SYSTEM",
        `ChildBot SUCCESSFULLY CREATED:
User: ${msg.username}
Room: ${msg.room}`
    );
}
            if (msg.handler === "login_event") {

                if (msg.type === "success") {

                    if (!done) {
                        done = true;
                        resolve({ success: true });
                    }
                }

                if (msg.type === "failed") {

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

        setTimeout(() => {
            if (!done) resolve({ success: false });
        }, 15000);

    });
}

function handlePM(msg) {

    const from = msg.from;
    const body = (msg.body || "").trim();

    if (body === "help") {
        send(from, "j/room#user#pass");
    }

    if (body.startsWith("j/")) {
        createBot(from, body);
    }
}

async function createBot(owner, cmd) {

    const [room, user, pass] = cmd.substring(2).split("#");

    const exists = loadJSON("./storage/bots.json", []);

    if (exists.find(x => x.room === room)) {
        return send(owner, "Room already has bot");
    }

    const bot = { room, username: user, password: pass, owner };

    exists.push(bot);
    saveJSON("./storage/bots.json", exists);

    const res = await ChildBot.start(bot);

    if (res.success) CHILD_BOTS.push(user);

    send(owner, res.success ? "ChildBot CREATED + JOINED" : "FAILED");
}

function send(to, body) {
    socket.send(JSON.stringify({
        handler: "chat_message",
        type: "text",
        to,
        body,
        id: Date.now().toString()
    }));
}

module.exports = { start };
