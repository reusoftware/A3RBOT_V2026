const WebSocket = require("ws");
const ChildBot = require("./childBot");

const {
    loadJSON,
    saveJSON
} = require("./storage");

let socket = null;

let CHILD_BOTS = [];

// ========================================
// PACKET ID
// ========================================

function generatePacketID() {

    return "BOT-" + Date.now();

}

// ========================================
// SEND STATUS TO WEB UI
// ========================================

function sendStatus(message, type = "info") {

    console.log("[STATUS]", message);

    const payload = {

        type: "bot_status",

        message,

        statusType: type,

        count: CHILD_BOTS.length

    };

    try {

        if (
            global.uiSocket &&
            global.uiSocket.readyState === 1
        ) {

            global.uiSocket.send(
                JSON.stringify(payload)
            );

        }

    } catch(err) {

        console.log(
            "UI SOCKET ERROR:",
            err
        );

    }

}

// ========================================
// START MAIN BOT
// ========================================

async function start(username, password) {

    return new Promise((resolve) => {

        try {

            socket = new WebSocket(
                "wss://chatp.net:5333/server"
            );

            let finished = false;

            // =========================
            // CONNECT
            // =========================

            socket.on("open", () => {

                console.log(
                    "MAIN BOT CONNECTED"
                );

                sendStatus(
                    "Main Bot Connected",
                    "success"
                );

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

            socket.on("message", async(data) => {

                try {

                    // IMPORTANT FIX
                    const text =
                        data.toString();

                    console.log(
                        "[MAINBOT RAW]",
                        text
                    );

                    const msg =
                        JSON.parse(text);

                    // =====================
                    // LOGIN SUCCESS
                    // =====================

                    if (
                        msg.handler === "login_event" &&
                        msg.type === "success"
                    ) {

                        console.log(
                            "MAINBOT LOGIN SUCCESS"
                        );

                        sendStatus(
                            "Main Bot Logged In",
                            "success"
                        );

                        if (!finished) {

                            finished = true;

                            resolve({
                                success: true,
                                message: "Login Success"
                            });

                        }

                    }

                    // =====================
                    // LOGIN FAILED
                    // =====================

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

                        sendStatus(
                            "Main Bot Login Failed",
                            "error"
                        );

                        if (!finished) {

                            finished = true;

                            resolve({
                                success: false,
                                message: "Wrong Credentials"
                            });

                        }

                    }

                    // =====================
                    // PRIVATE MESSAGE
                    // =====================

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

                sendStatus(
                    "MainBot Socket Error",
                    "error"
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

                sendStatus(
                    "MainBot Closed",
                    "error"
                );

            });

            // =========================
            // TIMEOUT
            // =========================

            setTimeout(() => {

                if (!finished) {

                    finished = true;

                    sendStatus(
                        "Login Timeout",
                        "error"
                    );

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
// HANDLE PRIVATE MESSAGE
// ========================================

async function handlePrivateMessage(msg) {

    try {

        if (!msg.body) return;

        const from =
            msg.from;

        const body =
            msg.body.trim();

        console.log(
            "[PRIVATE]",
            from,
            body
        );

        // =====================
        // HELP
        // =====================

        if (
            body.toLowerCase() === "help"
        ) {

            sendPrivate(
                from,

`SERVER FUN BOT GUIDE

Request ChildBot:
j/room#username#password

Example:
j/MyRoom#child1#pass123`
            );

        }

        // =====================
        // CREATE CHILDBOT
        // =====================

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

        const data =
            command
            .substring(2)
            .split("#");

        const room =
            data[0];

        const username =
            data[1];

        const password =
            data[2];

        if (
            !room ||
            !username ||
            !password
        ) {

            sendPrivate(
                owner,
                "Invalid Format"
            );

            return;

        }

        let bots =
            loadJSON(
                "./storage/bots.json",
                []
            );

        const exists =
            bots.find(
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

        sendStatus(
            `Creating ChildBot: ${username}`,
            "info"
        );

        sendPrivate(
            owner,
            `Creating ChildBot: ${username}`
        );

        // =====================
        // START BOT
        // =====================

        const result =
            await ChildBot.start(botConfig);

        if (result.success) {

            CHILD_BOTS.push(username);

        }

        sendStatus(

            `ChildBot ${username} => ${
                result.success
                    ? "CONNECTED"
                    : "FAILED"
            }`,

            result.success
                ? "success"
                : "error"

        );

        sendPrivate(

            owner,

`ChildBot Result

User: ${username}
Room: ${room}

Status:
${
    result.success
        ? "CONNECTED"
        : "FAILED"
}`

        );

    } catch(err) {

        console.log(
            "CREATE BOT ERROR:",
            err
        );

        sendStatus(
            "ChildBot crashed",
            "error"
        );

    }

}

// ========================================
// LOAD SAVED BOTS
// ========================================

function loadSavedBots() {

    try {

        const bots =
            loadJSON(
                "./storage/bots.json",
                []
            );

        bots.forEach(async(bot) => {

            console.log(
                "LOADING BOT:",
                bot.username
            );

            try {

                const result =
                    await ChildBot.start(bot);

                if (result.success) {

                    CHILD_BOTS.push(
                        bot.username
                    );

                }

                sendStatus(

                    `Loaded Bot ${
                        bot.username
                    } => ${
                        result.success
                            ? "CONNECTED"
                            : "FAILED"
                    }`,

                    result.success
                        ? "success"
                        : "error"

                );

            } catch(err) {

                console.log(
                    "LOAD BOT ERROR:",
                    err
                );

            }

        });

    } catch(err) {

        console.log(
            "LOAD SAVED BOT ERROR:",
            err
        );

    }

}

// ========================================
// SEND PRIVATE
// ========================================

function sendPrivate(to, body) {

    try {

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

    } catch(err) {

        console.log(
            "SEND PRIVATE ERROR:",
            err
        );

    }

}

// ========================================

module.exports = {
    start
};
