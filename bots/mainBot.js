const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket = null;

let CHILD_BOTS = {};

function packet() {
    return "MAIN-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

// =====================================
// UPDATE CONSOLE
// =====================================

function updateConsole() {

    const total = Object.keys(CHILD_BOTS).length;

    console.log("================================");
    console.log("[ACTIVE CHILDBOTS]", total);

    Object.values(CHILD_BOTS).forEach(bot => {

        console.log(
            `[BOT] ${bot.username} -> ${bot.room}`
        );

    });

    console.log("================================");
}

// =====================================
// SEND PM
// =====================================

function send(to, body) {

    try {

        if (!socket) return;

        if (socket.readyState !== 1) return;

        socket.send(JSON.stringify({

            handler: "chat_message",

            type: "text",

            to,

            body,

            id: packet()

        }));

    } catch(err) {

        console.log("[SEND ERROR]", err.message);

    }

}

// =====================================
// START MAIN BOT
// =====================================

function start(username, password) {

    return new Promise((resolve) => {

        console.log("[MAINBOT CONNECTING...]");

        socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let finished = false;

        socket.on("open", () => {

            console.log("[MAIN SOCKET OPEN]");

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

                    console.log("[MAIN LOGIN SUCCESS]");

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: true
                        });

                    }

                    loadSavedBots();

                }

                if (
                    msg.type === "failed" ||
                    msg.type === "error"
                ) {

                    console.log("[MAIN LOGIN FAILED]");

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: false
                        });

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

            setTimeout(() => {

                start(username, password);

            }, 5000);

        });

        socket.on("error", (err) => {

            console.log("[MAIN ERROR]", err.message);

        });

        // ================= KEEP ALIVE =================

        setInterval(() => {

            try {

                if (
                    socket &&
                    socket.readyState === 1
                ) {

                    socket.send(JSON.stringify({

                        handler: "ping",

                        id: packet()

                    }));

                }

            } catch {}

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

    // ================= HELP =================

    if (body.toLowerCase() === "help") {

        return send(from,

`BOT SERVER

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

        const split =
            command.substring(2).split("#");

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

        if (CHILD_BOTS[room]) {

            return send(
                owner,
                "Bot already active in room."
            );

        }

        let bots =
            loadJSON(
                "./storage/bots.json",
                []
            );

        bots = bots.filter(x =>
            x &&
            x.room &&
            x.username
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

        const result =
            await ChildBot.start(config);

        if (!result.success) {

            return send(
                owner,
                "Bot failed login."
            );

        }

        CHILD_BOTS[room] = {

            room,
            username,

            socket: result.socket

        };

        bots = bots.filter(
            x => x.room !== room
        );

        bots.push(config);

        saveJSON(
            "./storage/bots.json",
            bots
        );

        console.log(
            `[BOT CONNECTED] ${username}`
        );

        updateConsole();

        send(owner,

`BOT CREATED

Room: ${room}
Bot: ${username}`
        );

    } catch(err) {

        console.log(
            "[CREATE BOT ERROR]",
            err
        );

        send(
            owner,
            "Bot crashed."
        );

    }

}

// =====================================
// LOAD SAVED
// =====================================

async function loadSavedBots() {

    const bots =
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

            if (CHILD_BOTS[bot.room])
                continue;

            const result =
                await ChildBot.start(bot);

            if (result.success) {

                CHILD_BOTS[bot.room] = {

                    room: bot.room,

                    username: bot.username,

                    socket: result.socket

                };

                console.log(
                    `[RECONNECTED] ${bot.username}`
                );

            }

        } catch(err) {

            console.log(
                "[LOAD BOT ERROR]",
                err.message
            );

        }

    }

    updateConsole();

}

module.exports = {
    start
};
