const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

function packet() {

    return (
        "BOT-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 9999)
    );

}

// =====================================
// SEND ROOM MESSAGE
// =====================================

function sendRoomMessage(
    socket,
    room,
    body
) {

    try {

        if (!socket) return;
///===
        if (socket.readyState !== 1)
            return;

        socket.send(JSON.stringify({

            handler: "room_message",

            type: "text",

            room,

            body,

            url: "",

            length: "0",

            id: packet()

        }));

    } catch(err) {

        console.log(
            "[SEND ROOM ERROR]",
            err.message
        );

    }

}

// =====================================
// SAVE BOT CONFIG
// =====================================

function saveBotConfig(config) {

    let bots = loadJSON(
        "./storage/bots.json",
        []
    );

    const index = bots.findIndex(
        x => x.room === config.room
    );

    if (index !== -1) {

        bots[index] = config;

        saveJSON(
            "./storage/bots.json",
            bots
        );

    }

}

// =====================================
// START BOT
// =====================================

function start(config) {

    return new Promise((resolve) => {

        if (!config.roomMasters)
            config.roomMasters = [];

        if (config.welcome === undefined)
            config.welcome = true;

        if (config.quiz === undefined)
            config.quiz = true;

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let resolved = false;

        console.log(
            "[BOT STARTING]",
            config.username
        );

        // ================= OPEN =================

        socket.on("open", () => {

            console.log(
                "[BOT CONNECTED]",
                config.username
            );

            socket.send(JSON.stringify({

                handler: "login",

                username: config.username,

                password: config.password,

                id: packet()

            }));

        });

        // ================= MESSAGE =================

        socket.on("message", async(data) => {

            let msg;

            try {

                msg = JSON.parse(
                    data.toString()
                );

            } catch {

                return;

            }

            console.log(
                "[BOT RAW]",
                msg
            );

            // ================= LOGIN =================

            if (
                msg.handler === "login_event"
            ) {

                // SUCCESS
                if (msg.type === "success") {

                    console.log(
                        "[LOGIN SUCCESS]",
                        config.username
                    );

                    socket.send(JSON.stringify({

                        handler: "room_join",

                        name: config.room,

                        id: packet()

                    }));

                    // IMPORTANT FIX:
                    // resolve after short delay
                    // DO NOT WAIT FOR you_joined

                    setTimeout(() => {

                        if (!resolved) {

                            resolved = true;

                            console.log(
                                "[BOT READY]",
                                config.username
                            );

                            sendRoomMessage(
                                socket,
                                config.room,
                                "Im a Bot and ready to work!"
                            );

                            // AUTO START QUIZ
                            if (config.quiz) {

                                setTimeout(() => {

                                    QuizSystem.startQuiz(
                                        socket,
                                        config.room
                                    );

                                }, 5000);

                            }

                            resolve({
                                success: true,
                                socket
                            });

                        }

                    }, 4000);

                }

                // FAILED
                if (
                    msg.type === "failed" ||
                    msg.type === "error"
                ) {

                    console.log(
                        "[LOGIN FAILED]",
                        config.username
                    );

                    if (!resolved) {

                        resolved = true;

                        resolve({
                            success: false
                        });

                    }

                }

            }

            // ================= ROOM EVENTS =================

            if (
                msg.handler === "room_event"
            ) {

                await handleRoomEvent(
                    socket,
                    config,
                    msg
                );

            }

        });

        // ================= CLOSE =================

        socket.on("close", () => {

            console.log(
                "[BOT CLOSED]",
                config.username
            );

        });

        // ================= ERROR =================

        socket.on("error", (err) => {

            console.log(
                "[BOT ERROR]",
                err.message
            );

            if (!resolved) {

                resolved = true;

                resolve({
                    success: false
                });

            }

        });

        // ================= KEEP ALIVE =================

        setInterval(() => {

            try {

                if (
                    socket.readyState === 1
                ) {

                    socket.send(JSON.stringify({

                        handler: "ping",

                        id: packet()

                    }));

                }

            } catch {}

        }, 25000);

    });

}

// =====================================
// ROOM EVENTS
// =====================================

async function handleRoomEvent(
    socket,
    config,
    msg
) {

    const type = msg.type;

    // ================= USER JOIN =================

    if (type === "user_joined") {

        if (!config.welcome)
            return;

        const username =
            msg.username ||
            msg.from ||
            "User";

        sendRoomMessage(
            socket,
            config.room,
            `Welcome ${username}`
        );

    }

    // ================= ROOM MESSAGE =================

    if (
        type !== "text" &&
        type !== "message" &&
        type !== "chat"
    ) return;

    if (!msg.body) return;

    const body =
        msg.body.toLowerCase().trim();

    const from = msg.from;

    console.log(
        `[ROOM] ${from}: ${body}`
    );

    const isMainMaster =
        from === config.owner;

    const isRoomMaster =
        config.roomMasters.includes(from);

    const isMaster =
        isMainMaster || isRoomMaster;

    // ================= QUIZ ON =================

    if (body === "@quiz on") {

        if (!isMaster) return;

        config.quiz = true;

        saveBotConfig(config);

        QuizSystem.startQuiz(
            socket,
            config.room
        );

        return sendRoomMessage(
            socket,
            config.room,
            "Quiz enabled."
        );

    }

    // ================= QUIZ OFF =================

    if (body === "@quiz off") {

        if (!isMaster) return;

        config.quiz = false;

        saveBotConfig(config);

        QuizSystem.stopQuiz(
            config.room
        );

        return sendRoomMessage(
            socket,
            config.room,
            "Quiz disabled."
        );

    }

    // ================= ANSWER =================

    if (config.quiz) {

        QuizSystem.handleAnswer(
            socket,
            config.room,
            from,
            body
        );

    }

}

module.exports = {
    start
};
