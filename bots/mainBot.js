const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket;
let CHILD_BOTS = {};

function packet() {
    return "MAIN-" + Date.now();
}

// ================= UI UPDATE FIX =================
function updatePanel() {

    if (!global.uiSocket || global.uiSocket.readyState !== 1) return;

    const bots = Object.values(global.CHILD_CONNECTED || {});

    global.uiSocket.send(JSON.stringify({
        type: "dashboard",
        bots,
        count: bots.length
    }));

    console.log("[BOT COUNT]", bots.length);
}

// ================= START =================
function start(username, password) {

    return new Promise((resolve) => {

        socket = new WebSocket("wss://chatp.net:5333/server");

        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username,
                password,
                id: packet()
            }));

        });

        socket.on("message", async (data) => {

            let msg = JSON.parse(data);

            if (msg.handler === "login_event" && msg.type === "success") {
                resolve({ success: true });
                loadSavedBots();
            }

            if (msg.handler === "chat_message") {
                handlePM(msg);
            }

        });

        socket.on("close", () => {
            setTimeout(() => start(username, password), 5000);
        });

    });
}

// ================= CREATE BOT =================
async function createBot(owner, cmd) {

    const [room, user, pass] = cmd.substring(2).split("#");

    if (CHILD_BOTS[room]) {
        return send(owner, "Bot already exists in room");
    }

    const result = await ChildBot.start({
        room,
        username: user,
        password: pass,
        owner
    });

    if (!result.success) {
        return send(owner, "Bot failed");
    }

    CHILD_BOTS[room] = result.socket;

    updatePanel();

    send(owner, "Bot created!");
}

// ================= LOAD =================
async function loadSavedBots() {

    const bots = loadJSON("./storage/bots.json", []);

    for (const bot of bots) {

        if (CHILD_BOTS[bot.room]) continue;

        const result = await ChildBot.start(bot);

        if (result.success) {
            CHILD_BOTS[bot.room] = result.socket;
        }
    }

    updatePanel();
}

// ================= PM =================
function handlePM(msg) {

    const from = msg.from;
    const body = msg.body;

    if (body.startsWith("j/")) {
        createBot(from, body);
    }

}

function send(to, body) {

    if (!socket || socket.readyState !== 1) return;

    socket.send(JSON.stringify({
        handler: "chat_message",
        type: "text",
        to,
        body,
        id: packet()
    }));
}

module.exports = { start };
