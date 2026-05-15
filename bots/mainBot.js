const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket = null;

let CHILD_BOTS = {};
let MAIN_READY = false;

function packet() {
    return "MAIN-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

// =====================================
// START MAIN BOT
// =====================================

function start(username, password) {

    return new Promise((resolve) => {

        socket = new WebSocket("wss://chatp.net:5333/server");

        let finished = false;

        socket.on("open", () => {

            console.log("[MAIN CONNECTED]");

            socket.send(JSON.stringify({
                handler: "login",
                username,
                password,
                id: packet()
            }));
        });

        socket.on("message", async(data) => {

            let msg;

            try {
                msg = JSON.parse(data.toString());
            } catch {
                return;
            }

            // ================= LOGIN =================

            if (msg.handler === "login_event") {

                if (msg.type === "success") {

                    MAIN_READY = true;

                    console.log("[MAIN LOGIN SUCCESS]");

                    if (!finished) {
                        finished = true;
                        resolve({ success: true });
                    }

                    loadSavedBots();
                }

                if (msg.type === "failed") {

                    console.log("[MAIN LOGIN FAILED]");

                    if (!finished) {
                        finished = true;
                        resolve({ success: false });
                    }
                }
            }

            // ================= PM =================

            if (msg.handler === "chat_message") {
                handlePM(msg);
            }
        });

        socket.on("close", () => {

            console.log("[MAIN CLOSED]");

            MAIN_READY = false;

            setTimeout(() => {
                start(username, password);
            }, 5000);
        });

        socket.on("error", (e) => {
            console.log("[MAIN ERROR]", e.message);
        });

        // keep alive
        setInterval(() => {

            if (socket.readyState === 1) {

                socket.send(JSON.stringify({
                    handler: "ping",
                    id: packet()
                }));
            }

        }, 20000);

    });
}

// =====================================
// PM COMMANDS
// =====================================

function handlePM(msg) {

    const from = msg.from;
    const body = (msg.body || "").trim();

    console.log("[PM]", from, body);

    // ================= HELP =================

    if (body.toLowerCase() === "help") {

        return send(from,
`BOT CREATOR

Create Bot:
j/room#username#password

Example:
j/myroom#bot1#123456`
        );
    }

    // ================= CREATE =================

    if (body.startsWith("j/")) {
        createBot(from, body);
    }
}

// =====================================
// CREATE BOT
// =====================================

async function createBot(owner, command) {

    try {

        const split = command.substring(2).split("#");

        const room = split[0];
        const username = split[1];
        const password = split[2];

        if (!room || !username || !password) {
            return send(owner, "Invalid format.");
        }

        let bots = loadJSON("./storage/bots.json", []);

        // remove dead duplicates
        bots = bots.filter(x =>
            x &&
            x.room &&
            x.username
        );

        // already active
        if (CHILD_BOTS[room]) {
            return send(owner, "Room already has active bot.");
        }

        // remove old dead room config
        bots = bots.filter(x => x.room !== room);

        const config = {
            room,
            username,
            password,
            owner,
            roomMasters: [],
            welcome: true,
            quiz: true
        };

        send(owner, `Creating bot ${username}...`);

        const result = await ChildBot.start(config);

        if (!result.success) {
            return send(owner, "Bot failed login/join.");
        }

        CHILD_BOTS[room] = result.bot;

        bots.push(config);

        saveJSON("./storage/bots.json", bots);

        send(owner,
`BOT SUCCESSFULLY CREATED

Room: ${room}
Bot: ${username}`
        );

    } catch(err) {

        console.log("[CREATE ERROR]", err);

        send(owner, "Bot crashed.");
    }
}

// =====================================
// LOAD SAVED
// =====================================

async function loadSavedBots() {

    const bots = loadJSON("./storage/bots.json", []);

    console.log("[LOADING SAVED BOTS]", bots.length);

    for (const bot of bots) {

        try {

            const result = await ChildBot.start(bot);

            if (result.success) {

                CHILD_BOTS[bot.room] = result.bot;

                console.log("[RECONNECTED]", bot.username);
            }

        } catch(err) {

            console.log("[LOAD BOT ERROR]", err);
        }
    }
}

// =====================================
// SEND PM
// =====================================

function send(to, body) {

    if (!socket) return;
    if (socket.readyState !== 1) return;

    socket.send(JSON.stringify({
        handler: "chat_message",
        type: "text",
        to,
        body,
        id: packet()
    }));
}

module.exports = { start };
