const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket;
let ACTIVE_BOTS = {}; // room => bot

function packet() {
    return "MAIN-" + Date.now();
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
                id: packet()
            }));
        });

        socket.on("message", async (data) => {

            let msg;
            try {
                msg = JSON.parse(data);
            } catch { return; }

            // LOGIN
            if (msg.handler === "login_event") {

                if (msg.type === "success") {
                    console.log("[MAIN LOGIN OK]");
                    if (!done) {
                        done = true;
                        resolve({ success: true });
                    }

                    loadSavedBots();
                }
            }

            // PRIVATE MESSAGE
            if (msg.handler === "chat_message") {
                handlePM(msg);
            }
        });

        socket.on("close", () => {
            console.log("[MAIN CLOSED]");
            setTimeout(() => start(username, password), 5000);
        });

    });
}

// ================= CREATE BOT =================
async function createBot(owner, body) {

    const [room, user, pass] = body.substring(2).split("#");

    if (!room || !user || !pass)
        return send(owner, "Invalid format");

    let bots = loadJSON("./storage/bots.json", []);

    if (ACTIVE_BOTS[room])
        return send(owner, "Bot already active in this room");

    const config = {
        room,
        username: user,
        password: pass,
        owner,
        roomMasters: [],
        welcome: true,
        quiz: false
    };

    send(owner, "Creating bot...");

    const result = await ChildBot.start(config);

    if (!result.success)
        return send(owner, "Bot failed to join/login");

    ACTIVE_BOTS[room] = result.bot;

    bots.push(config);
    saveJSON("./storage/bots.json", bots);

    send(owner, `Bot ACTIVE in ${room}`);
}

// ================= LOAD SAVED =================
async function loadSavedBots() {

    let bots = loadJSON("./storage/bots.json", []);

    for (const b of bots) {

        const result = await ChildBot.start(b);

        if (result.success) {
            ACTIVE_BOTS[b.room] = result.bot;
        }
    }
}

// ================= PM =================
function handlePM(msg) {

    const from = msg.from;
    const body = (msg.body || "").trim();

    if (body === "help") {
        return send(from, "j/room#user#pass");
    }

    if (body.startsWith("j/")) {
        createBot(from, body);
    }
}

function send(to, body) {
    socket.send(JSON.stringify({
        handler: "chat_message",
        type: "text",
        to,
        body,
        id: packet()
    }));
}

module.exports = { start };
