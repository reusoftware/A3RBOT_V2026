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

// ======================================
// SEND ROOM MESSAGE
// ======================================

function sendRoomMessage(
    socket,
    room,
    body
) {

    try {

        if (!socket) return;

        if (socket.readyState !== 1)
            return;

        socket.send(JSON.stringify({

            handler: "room_message",

            type: "text",

            room: room,

            body: body,

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

// ======================================
// SAVE CONFIG
// ======================================

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

// ======================================
// START BOT
// ======================================

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

        let joined = false;

        console.log(
            "[CHILDBOT STARTING]",
            config.username
        );

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

        socket.on("message", async(data) => {

            let msg;

            try {

                msg = JSON.parse(
                    data.toString()
                );

            } catch {

                return;

            }

            // ================= LOGIN =================

            if (
                msg.handler === "login_event"
            ) {

                if (msg.type === "success") {

                    console.log(
                        "[BOT LOGIN SUCCESS]",
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
                        "[BOT LOGIN FAILED]",
                        config.username
                    );

                    return resolve({
                        success: false
                    });

                }

            }

            // ================= ROOM =================

            if (
                msg.handler === "room_event"
            ) {

                // SUCCESS JOIN
                if (
                    msg.type === "you_joined" &&
                    !joined
                ) {

                    joined = true;

                    console.log(
                        `[ROOM JOINED] ${config.room}`
                    );

                    sendRoomMessage(
                        socket,
                        config.room,
                        "Im a Bot and ready to work!"
                    );

                    // QUIZ AUTO START
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

                await handleRoomEvent(
                    socket,
                    config,
                    msg
                );

            }

        });

        socket.on("close", () => {

            console.log(
                "[BOT CLOSED]",
                config.username
            );

        });

        socket.on("error", (err) => {

            console.log(
                "[BOT ERROR]",
                err.message
            );

        });

        // KEEP ALIVE
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

// ======================================
// ROOM EVENTS
// ======================================

async function handleRoomEvent(
    socket,
    config,
    msg
) {

    const type = msg.type;

    // ================= USER JOINED =================

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

    // ================= HELP =================

    if (body === "help") {

        return sendRoomMessage(
            socket,
            config.room,

`BOT COMMANDS

help
myscore
top
masters

@welcome on
@welcome off

@quiz on
@quiz off

@addmaster username
@removemaster username`
        );

    }

    // ================= MASTER LIST =================

    if (body === "masters") {

        return sendRoomMessage(
            socket,
            config.room,

            config.roomMasters.length === 0
                ? "No room masters."
                : config.roomMasters.join(", ")
        );

    }

    // ================= ADD MASTER =================

    if (
        body.startsWith("@addmaster ")
    ) {

        if (!isMaster) return;

        const target =
            body.replace(
                "@addmaster ",
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
            `${target} added as master.`
        );

    }

    // ================= REMOVE MASTER =================

    if (
        body.startsWith("@removemaster ")
    ) {

        if (!isMaster) return;

        const target =
            body.replace(
                "@removemaster ",
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

    // ================= ANSWERS =================

    if (config.quiz) {

        QuizSystem.handleAnswer(
            socket,
            config.room,
            from,
            body
        );

    }

    // ================= MYSCORE =================

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

        const user = scores[from];

        return sendRoomMessage(
            socket,
            config.room,

`${from}
Score: ${user.score}
Best: ${user.best.toFixed(2)}s`
        );

    }

    // ================= TOP =================

    if (body === "top") {

        const scores = loadJSON(
            "./storage/scores.json",
            {}
        );

        const top =
            Object.entries(scores)
            .sort((a, b) =>
                b[1].score - a[1].score
            )
            .slice(0, 10);

        if (top.length === 0) {

            return sendRoomMessage(
                socket,
                config.room,
                "No scores yet."
            );

        }

        let text = "🏆 TOP PLAYERS\n\n";

        top.forEach((x, i) => {

            text +=
                `${i + 1}. ${x[0]} - ${x[1].score}\n`;

        });

        return sendRoomMessage(
            socket,
            config.room,
            text
        );

    }

}

module.exports = {
    start
};
