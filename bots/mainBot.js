const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket = null;

let CHILD_BOTS = {};
let MAIN_READY = false;

// =====================================
// PACKET
// =====================================

function packet() {
    return "MAIN-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

// =====================================
// SEND UI STATUS
// =====================================

function updatePanel() {

    try {

        if (
            global.uiSocket &&
            global.uiSocket.readyState === 1
        ) {

            const activeBots = Object.values(CHILD_BOTS)
                .map(x => ({
                    room: x.room,
                    username: x.username
                }));

            global.uiSocket.send(JSON.stringify({

                type: "dashboard",

                bots: activeBots,

                count: activeBots.length

            }));
        }

    } catch(err) {

        console.log("[UI ERROR]", err);

    }
}

// =====================================
// START MAIN BOT
// =====================================

function start(username, password) {

    return new Promise((resolve) => {

        socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

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

                // SUCCESS
                if (msg.type === "success") {

                    MAIN_READY = true;

                    console.log("[MAIN LOGIN SUCCESS]");

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: true
                        });
                    }

                    loadSavedBots();
                }

                // FAILED
                if (msg.type === "failed") {

                    console.log("[MAIN LOGIN FAILED]");

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: false
                        });
                    }
                }
            }

            // ================= PRIVATE MESSAGE =================

            if (msg.handler === "chat_message") {

                handlePM(msg);

            }

        });

        // ================= CLOSE =================

        socket.on("close", () => {

            console.log("[MAIN CLOSED]");

            MAIN_READY = false;

            setTimeout(() => {

                start(username, password);

            }, 5000);

        });

        // ================= ERROR =================

        socket.on("error", (e) => {

            console.log("[MAIN ERROR]", e.message);

        });

        // ================= KEEP ALIVE =================

        setInterval(() => {

            if (
                socket &&
                socket.readyState === 1
            ) {

                socket.send(JSON.stringify({
                    handler: "ping",
                    id: packet()
                }));

            }

        }, 20000);

    });

}

// =====================================
// HANDLE PM
// =====================================

function handlePM(msg) {

    const from = msg.from;

    const body =
        (msg.body || "")
        .trim();

    console.log("[PM]", from, body);

    // HELP
    if (
        body.toLowerCase() === "help"
    ) {

        return send(from,

`BOT CREATOR

Create Bot:
j/room#username#password

Example:
j/myroom#bot1#123456`
        );
    }

    // CREATE BOT
    if (body.startsWith("j/")) {

        createBot(from, body);

    }

}

// =====================================
// CREATE BOT
// =====================================

async function createBot(owner, command) {

    try {

        const split =
            command
            .substring(2)
            .split("#");

        const room = split[0];
        const username = split[1];
        const password = split[2];

        if (
            !room ||
            !username ||
            !password
        ) {

            return send(
                owner,
                "Invalid format."
            );

        }

        // already active
        if (CHILD_BOTS[room]) {

            return send(
                owner,
                "Room already has active bot."
            );

        }

        let bots =
            loadJSON(
                "./storage/bots.json",
                []
            );

        // remove corrupted
        bots = bots.filter(x =>
            x &&
            x.room &&
            x.username
        );

        // remove dead duplicate room
        bots = bots.filter(
            x => x.room !== room
        );

        const config = {

            room,
            username,
            password,
            owner,

            roomMasters: [],

            welcome: true,

            quiz: true

        };

        send(
            owner,
            `Creating bot ${username}...`
        );

        // START BOT
        const result =
            await ChildBot.start(config);

        if (!result.success) {

            return send(
                owner,
                "Bot failed login/join."
            );

        }

        // SAVE ACTIVE
        CHILD_BOTS[room] = {

            room,
            username,

            socket: result.socket

        };

        // SAVE STORAGE
        bots.push(config);

        saveJSON(
            "./storage/bots.json",
            bots
        );

        updatePanel();

        send(owner,

`BOT SUCCESSFULLY CREATED

Room: ${room}
Bot: ${username}`
        );

    } catch(err) {

        console.log(
            "[CREATE ERROR]",
            err
        );

        send(
            owner,
            "Bot crashed."
        );

    }

}

// =====================================
// LOAD SAVED BOTS
// =====================================

async function loadSavedBots() {

    let bots =
        loadJSON(
            "./storage/bots.json",
            []
        );

    console.log(
        "[LOADING SAVED BOTS]",
        bots.length
    );

    for (const bot of bots) {

        try {

            // skip already active
            if (CHILD_BOTS[bot.room]) {
                continue;
            }

            const result =
                await ChildBot.start(bot);

            if (result.success) {

                CHILD_BOTS[bot.room] = {

                    room: bot.room,

                    username: bot.username,

                    socket: result.socket

                };

                console.log(
                    "[RECONNECTED]",
                    bot.username
                );

            }

        } catch(err) {

            console.log(
                "[LOAD BOT ERROR]",
                err
            );

        }

    }

    updatePanel();

}

// =====================================
// REMOVE DEAD BOT
// =====================================

function removeBot(room) {

    if (CHILD_BOTS[room]) {

        delete CHILD_BOTS[room];

        updatePanel();

    }

}

// =====================================
// SEND PM
// =====================================

function send(to, body) {

    try {

        if (!socket) return;

        if (socket.readyState !== 1)
            return;

        socket.send(JSON.stringify({

            handler: "chat_message",

            type: "text",

            to,

            body,

            id: packet()

        }));

    } catch(err) {

        console.log(
            "[SEND ERROR]",
            err
        );

    }

}

// =====================================

module.exports = {

    start,

    removeBot,

    CHILD_BOTS

};
