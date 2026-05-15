const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket;

// ACTIVE CHILD BOTS
let CHILD_BOTS = {};

function generateID() {
    return "MAIN-" + Date.now();
}

// ========================================
// START MAIN BOT
// ========================================

function start(username, password) {

    return new Promise((resolve) => {

        socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let finished = false;

        // ================= CONNECT =================
        socket.on("open", () => {

            console.log("[MAINBOT CONNECTED]");

            socket.send(JSON.stringify({
                handler: "login",
                username,
                password,
                id: generateID()
            }));

        });

        // ================= MESSAGE =================
        socket.on("message", async(data) => {

            let msg;

            try {
                msg = JSON.parse(data);
            } catch {
                return;
            }

            console.log("[MAINBOT RAW]", msg);

            // ================= LOGIN =================
            if (msg.handler === "login_event") {

                if (msg.type === "success") {

                    console.log("[MAINBOT LOGIN SUCCESS]");

                    loadSavedBots();

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: true
                        });

                    }
                }

                if (
                    msg.type === "failed" ||
                    msg.type === "error"
                ) {

                    console.log("[MAINBOT LOGIN FAILED]");

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: false
                        });

                    }
                }
            }

            // ================= PRIVATE MESSAGE =================
            if (
                msg.handler === "chat_message"
            ) {

                handlePM(msg);

            }

        });

        // ================= CLOSE =================
        socket.on("close", () => {

            console.log("[MAINBOT CLOSED]");

        });

        // ================= ERROR =================
        socket.on("error", (err) => {

            console.log(
                "[MAINBOT ERROR]",
                err.message
            );

        });

    });

}

// ========================================
// HANDLE PM
// ========================================

function handlePM(msg) {

    const from = msg.from;

    const body =
        (msg.body || "")
        .trim();

    console.log(
        "[PM]",
        from,
        body
    );

    // HELP
    if (
        body.toLowerCase() === "help"
    ) {

        return send(
            from,

`To Create Bot:

j/room#username#password

Example:
j/MyRoom#bot1#123456`
        );

    }

    // CREATE BOT
    if (
        body.startsWith("j/")
    ) {

        createBot(from, body);

    }

}

// ========================================
// CREATE BOT
// ========================================

async function createBot(owner, cmd) {

    try {

        const data =
            cmd.substring(2).split("#");

        const room = data[0];
        const user = data[1];
        const pass = data[2];

        if (
            !room ||
            !user ||
            !pass
        ) {

            return send(
                owner,
                "Invalid Format"
            );

        }

        // ================= ACTIVE CHECK =================
        if (CHILD_BOTS[room]) {

            return send(
                owner,
                "Room already has active bot."
            );

        }

        // ================= SAVE CHECK =================
        let bots =
            loadJSON(
                "./storage/bots.json",
                []
            );

        // REMOVE DEAD DUPLICATES
        bots = bots.filter(
            x => x.room !== room
        );

        const botConfig = {

            room,
            username: user,
            password: pass,
            owner,

            welcome: true,
            quiz: true,
            roomMasters: []

        };

        bots.push(botConfig);

        saveJSON(
            "./storage/bots.json",
            bots
        );

        send(
            owner,
            `Creating ChildBot ${user}...`
        );

        // ================= START BOT =================
        const result =
            await ChildBot.start(botConfig);

        if (
            result &&
            result.success
        ) {

            CHILD_BOTS[room] = {

                username: user,
                room

            };

            send(
                owner,

`✅ ChildBot Created

Bot: ${user}
Room: ${room}`
            );

            console.log(
                "[BOT ONLINE]",
                room
            );

        } else {

            send(
                owner,
                "❌ ChildBot Failed"
            );

        }

    } catch(err) {

        console.log(
            "[CREATE BOT ERROR]",
            err
        );

    }

}

// ========================================
// LOAD SAVED BOTS
// ========================================

async function loadSavedBots() {

    try {

        const bots =
            loadJSON(
                "./storage/bots.json",
                []
            );

        console.log(
            "[AUTO LOAD BOTS]",
            bots.length
        );

        for (const bot of bots) {

            try {

                const result =
                    await ChildBot.start(bot);

                if (
                    result &&
                    result.success
                ) {

                    CHILD_BOTS[bot.room] = {

                        username: bot.username,
                        room: bot.room

                    };

                    console.log(
                        "[AUTO RECONNECTED]",
                        bot.username
                    );

                }

            } catch(err) {

                console.log(
                    "[AUTO LOAD ERROR]",
                    err
                );

            }

        }

    } catch(err) {

        console.log(
            "[LOAD BOT ERROR]",
            err
        );

    }

}

// ========================================
// SEND PM
// ========================================

function send(to, body) {

    if (!socket) return;

    socket.send(JSON.stringify({

        handler: "chat_message",

        type: "text",

        to,

        body,

        id: generateID()

    }));

}

// ========================================

module.exports = {
    start
};
