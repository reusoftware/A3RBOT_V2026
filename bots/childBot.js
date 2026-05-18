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

function sendRoomMessage(socket, room, body) {

    try {

        if (!socket) return;

        if (socket.readyState !== 1)
            return;

        socket.send(JSON.stringify({

            handler: "room_message",

            type: "text",

            id: packet(),

            body: body,

            room: room,

            url: "",

            length: "0"

        }));

        console.log("[BOT SEND]", body);

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

                }

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

            // ================= ROOM EVENT =================

            if (
                msg.handler === "room_event"
            ) {

                // ROOM JOINED
                if (
                    msg.type === "you_joined"
                ) {

                    console.log(
                        "[ROOM JOINED]",
                        config.room
                    );

                    if (!resolved) {

                        resolved = true;

                        resolve({
                            success: true,
                            socket
                        });

                    }

                    setTimeout(() => {

                        sendRoomMessage(
                            socket,
                            config.room,
                            "Im a Bot and ready to work!"
                        );

                    }, 10000);

                    // AUTO QUIZ
                    if (config.quiz) {

                        setTimeout(() => {

                            QuizSystem.startQuiz(
                                socket,
                                config.room
                            );

                        }, 20000);

                    }

                }

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

    // USER JOINED
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

        return;
    }

    // ROOM TEXT
    if (!msg.body) return;

    const body =
        String(msg.body)
        .toLowerCase()
        .trim();

    const from =
        msg.from ||
        msg.username;

    console.log(
        `[ROOM] ${from}: ${body}`
    );

    const isMainMaster =
        from === config.owner;

    const isRoomMaster =
        config.roomMasters.includes(from);

    const isMaster =
        isMainMaster || isRoomMaster;

    // HELP
    if (body === "help") {

        return sendRoomMessage(
            socket,
            config.room,

`COMMANDS

help
myscore
maslist

+quiz
-quiz

+wc
-wc

mas+username
mas-username`
        );

    }

    // MASTER LIST
    if (body === "maslist") {

        return sendRoomMessage(
            socket,
            config.room,

            config.roomMasters.length === 0
                ? "No room masters."
                : config.roomMasters.join(", ")

        );

    }

    // ADD MASTER
    if (body.startsWith("mas+")) {

        if (!isMaster) return;

        const target =
            body.replace(
                "mas+",
                ""
            ).trim();

        if (
            !config.roomMasters.includes(target)
        ) {

            config.roomMasters.push(target);

            saveBotConfig(config);

        }

        return sendRoomMessage(
            socket,
            config.room,
            `${target} added as Room master.`
        );

    }

    // REMOVE MASTER
    if (body.startsWith("mas-")) {

        if (!isMaster) return;

        const target =
            body.replace(
                "mas-",
                ""
            ).trim();

        config.roomMasters =
            config.roomMasters.filter(
                x => x !== target
            );

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            `${target} removed.`
        );

    }

    // QUIZ ON
    if (body === "+quiz") {

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

    // QUIZ OFF
    if (body === "-quiz") {

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

    // WELCOME ON
    if (body === "+wc") {

        if (!isMaster) return;

        config.welcome = true;

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            "Welcome enabled."
        );

    }

    // WELCOME OFF
    if (body === "-wc") {

        if (!isMaster) return;

        config.welcome = false;

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            "Welcome disabled."
        );

    }

    // QUIZ ANSWER
    if (config.quiz) {

        QuizSystem.handleAnswer(
            socket,
            config.room,
            from,
            body
        );

    }

    // SCORE
    if (body === "myscore") {

        const scores = loadJSON(
            "./storage/scores.json",
            {}
        );

        if (!scores[from]) {

            return sendRoomMessage(
                socket,
                config.room,
                "No score yet."
            );

        }

        return sendRoomMessage(
            socket,
            config.room,

`${from}
Score: ${scores[from].score}`

        );

    }

}

module.exports = {
    start
};
