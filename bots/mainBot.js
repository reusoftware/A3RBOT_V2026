const WebSocket = require("ws");
const ChildBot = require("./childBot");
let CHILD_BOTS = [];
const {
    loadJSON,
    saveJSON
} = require("./storage");

let socket;

function generatePacketID() {
    return "BOT-" + Date.now();
}

async function start(username, password) {

    return new Promise((resolve) => {

        try {

            socket = new WebSocket(
                "wss://chatp.net:5333/server"
            );

            let finished = false;

            // =========================
            // CONNECTED
            // =========================

            socket.on("open", () => {

                console.log("Main Bot Connected");

                socket.send(JSON.stringify({
                    handler: "login",
                    username: username,
                    password: password,
                    id: generatePacketID()
                }));

            });

            // =========================
            // MESSAGE
            // =========================
function sendStatus(message, type = "info") {

    console.log("[STATUS]", message);

    // If you have websocket to frontend (you must already have UI socket)
    if (global.uiSocket) {

        global.uiSocket.send(JSON.stringify({
            type: "bot_status",
            message,
            statusType: type,
            count: CHILD_BOTS.length
        }));

    }
}
            socket.on("message", async(data) => {

                try {

                    const msg = JSON.parse(data);

                    console.log("[MAINBOT RAW]", msg);

                    // =========================
                    // LOGIN SUCCESS
                    // =========================

                    if (
                        msg.handler === "login_event" &&
                        msg.type === "success"
                    ) {

                        console.log(
                            "MAINBOT LOGIN SUCCESS"
                        );

                        if (!finished) {

                            finished = true;

                            resolve({
                                success: true,
                                message: "Login Success"
                            });

                        }

                    }

                    // =========================
                    // LOGIN FAILED
                    // =========================

                    if (
                        msg.handler === "login_event" &&
                        (
                            msg.type === "failed" ||
                            msg.type === "error"
                        )
                    ) {

                        console.log(
                            "MAINBOT LOGIN FAILED"
                        );

                        if (!finished) {

                            finished = true;

                            resolve({
                                success: false,
                                message: "Wrong Credentials"
                            });

                        }

                    }

                    // =========================
                    // PRIVATE MESSAGE
                    // =========================

                    if (
                        msg.handler === "chat_message"
                    ) {

                        await handlePrivateMessage(msg);

                    }

                } catch(err) {

                    console.log(
                        "MAINBOT MESSAGE ERROR:",
                        err
                    );

                }

            });

            // =========================
            // ERROR
            // =========================

            socket.on("error", (err) => {

                console.log(
                    "MAINBOT SOCKET ERROR:",
                    err
                );

                if (!finished) {

                    finished = true;

                    resolve({
                        success: false,
                        message: "Socket Error"
                    });

                }

            });

            // =========================
            // CLOSE
            // =========================

            socket.on("close", () => {

                console.log(
                    "MAINBOT CLOSED"
                );

            });

            // =========================
            // TIMEOUT
            // =========================

            setTimeout(() => {

                if (!finished) {

                    finished = true;

                    resolve({
                        success: false,
                        message: "Login Timeout"
                    });

                }

            }, 15000);

            // =========================
            // LOAD SAVED BOTS
            // =========================

            loadSavedBots();

        } catch(err) {

            console.log(
                "MAINBOT CRASH:",
                err
            );

            resolve({
                success: false,
                message: "Server Error"
            });

        }

    });

}

// ========================================
// PRIVATE MESSAGE
// ========================================

async function handlePrivateMessage(msg) {

    try {

        if (!msg.body) return;

        const from = msg.from;
        const body = msg.body.trim();

        console.log(
            "PRIVATE MESSAGE:",
            body
        );

        // =========================
        // HELP
        // =========================

        if (
            body.toLowerCase() === "help"
        ) {

            sendPrivate(
                from,

`SERVER FUN BOT GUIDE

Request ChildBot:
j/room#username#password

Example:
j/MyRoom#child1#pass123

Commands:
@welcome on
@welcome off
@quiz on
@quiz off
myscore
@gtop`
            );

        }

        // =========================
        // CREATE CHILDBOT
        // =========================

        if (
            body.startsWith("j/")
        ) {

            await createChildBot(
                from,
                body
            );

        }

    } catch(err) {

        console.log(
            "PRIVATE MESSAGE ERROR:",
            err
        );

    }

}

// ========================================
// CREATE CHILDBOT
// ========================================

async function createChildBot(owner, command) {

    try {

        const data = command
            .substring(2)
            .split("#");

        const room = data[0];
        const username = data[1];
        const password = data[2];

        if (
            !room ||
            !username ||
            !password
        ) {

            sendPrivate(
                owner,
                "Invalid format."
            );

            return;

        }

        let bots = loadJSON(
            "./storage/bots.json",
            []
        );

        const exists = bots.find(
            x => x.room === room
        );

        if (exists) {

            sendPrivate(
                owner,
                "Room already has bot."
            );

            return;

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

        saveJSON(
            "./storage/bots.json",
            bots
        );

        // =========================
        // START BOT
        // =========================

        ChildBot.start(botConfig);

        sendPrivate(
            owner,
            `ChildBot created for ${room}`
        );

    } catch(err) {

        console.log(
            "CREATE BOT ERROR:",
            err
        );

    }

}

// ========================================
// LOAD SAVED BOTS
// ========================================

function loadSavedBots() {

    try {

        const bots = loadJSON(
            "./storage/bots.json",
            []
        );

        bots.forEach(bot => {

            console.log(
                "LOADING BOT:",
                bot.username
            );

            ChildBot.start(bot);

        });

    } catch(err) {

        console.log(
            "LOAD BOT ERROR:",
            err
        );

    }

}

// ========================================
// SEND PRIVATE
// ========================================

function sendPrivate(to, body) {

    try {

        socket.send(JSON.stringify({
            handler: "chat_message",
            type: "text",
            to,
            body,
            url: "",
            length: "0",
            id: generatePacketID()
        }));

    } catch(err) {

        console.log(
            "SEND PRIVATE ERROR:",
            err
        );

    }

}

module.exports = {
    start
};
