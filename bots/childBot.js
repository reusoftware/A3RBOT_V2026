const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function packet() {
    return "BOT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

const ACTIVE_BOTS = {};

function start(config) {

    return new Promise((resolve) => {

        // prevent duplicate bot
        if (ACTIVE_BOTS[config.room]) {

            console.log("[ALREADY RUNNING]", config.room);

            return resolve({
                success: true,
                alreadyRunning: true,
                bot: ACTIVE_BOTS[config.room]
            });
        }

        let joined = false;
        let reconnecting = false;

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let pingInterval = null;

        console.log(
            "[BOT START]",
            config.username
        );

        ACTIVE_BOTS[config.room] = {
            socket,
            config
        };

        // =========================
        // OPEN
        // =========================

        socket.on("open", () => {

            console.log(
                "[CONNECTED]",
                config.username
            );

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: packet()
            }));

        });

        // =========================
        // MESSAGE
        // =========================

        socket.on("message", (data) => {

            let msg;

            try {
                msg = JSON.parse(data.toString());
            } catch {
                return;
            }

            // ================= LOGIN SUCCESS =================

            if (
                msg.handler === "login_event" &&
                msg.type === "success"
            ) {

                console.log(
                    "[LOGIN SUCCESS]",
                    config.username
                );

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: packet()
                }));

                return;
            }

            // ================= LOGIN FAILED =================

            if (
                msg.handler === "login_event" &&
                msg.type === "failed"
            ) {

                console.log(
                    "[LOGIN FAILED]",
                    config.username
                );

                delete ACTIVE_BOTS[config.room];

                return resolve({
                    success: false
                });
            }

            // ================= ROOM EVENTS =================

            if (msg.handler === "room_event") {

                // room ready
                if (
                    msg.type === "you_joined" &&
                    !joined
                ) {

                    joined = true;

                    console.log(
                        "[ROOM JOINED]",
                        config.room
                    );

                    sendRoom(
                        socket,
                        config.room,
                        "🤖 Bot Online"
                    );

                    // start quiz once only
                    if (config.quiz !== false) {

                        setTimeout(() => {

                            if (
                                socket.readyState === 1
                            ) {

                                QuizSystem.startQuiz(
                                    socket,
                                    config.room
                                );
                            }

                        }, 4000);
                    }

                    // keep alive
                    pingInterval = setInterval(() => {

                        if (
                            socket.readyState === 1
                        ) {

                            socket.send(JSON.stringify({
                                handler: "ping",
                                id: packet()
                            }));

                        }

                    }, 20000);

                    return resolve({
                        success: true,
                        bot: ACTIVE_BOTS[config.room]
                    });
                }

                // welcome
                if (
                    msg.type === "user_joined" &&
                    config.welcome
                ) {

                    sendRoom(
                        socket,
                        config.room,
                        `Welcome ${msg.username}`
                    );
                }

                // text commands
                if (msg.type === "text") {

                    handleCommands(
                        socket,
                        config,
                        msg
                    );
                }
            }

        });

        // =========================
        // CLOSE
        // =========================

        socket.on("close", () => {

            console.log(
                "[BOT CLOSED]",
                config.username
            );

            if (pingInterval) {
                clearInterval(pingInterval);
            }

            delete ACTIVE_BOTS[config.room];

            // prevent reconnect spam
            if (reconnecting) return;

            reconnecting = true;

            setTimeout(() => {

                console.log(
                    "[RECONNECTING]",
                    config.username
                );

                start(config);

            }, 8000);

        });

        // =========================
        // ERROR
        // =========================

        socket.on("error", (e) => {

            console.log(
                "[BOT ERROR]",
                e.message
            );

        });

    });
}

// ======================================
// COMMANDS
// ======================================

function handleCommands(socket, config, msg) {

    const body =
        (msg.body || "")
        .trim()
        .toLowerCase();

    const from = msg.from;

    if (!body) return;

    // ================= QUIZ ANSWER =================

    if (config.quiz !== false) {

        QuizSystem.handleAnswer(
            socket,
            config.room,
            from,
            body
        );
    }

    // ================= HELP =================

    if (body === "help") {

        return sendRoom(
            socket,
            config.room,

`BOT COMMANDS

help
myscore
+quiz
-quiz
+wc
-wc`
        );
    }

    // ================= QUIZ ON =================

    if (body === "+quiz") {

        config.quiz = true;

        saveBot(config);

        QuizSystem.startQuiz(
            socket,
            config.room
        );

        return sendRoom(
            socket,
            config.room,
            "Quiz Enabled"
        );
    }

    // ================= QUIZ OFF =================

    if (body === "-quiz") {

        config.quiz = false;

        saveBot(config);

        return sendRoom(
            socket,
            config.room,
            "Quiz Disabled"
        );
    }

    // ================= WC ON =================

    if (body === "+wc") {

        config.welcome = true;

        saveBot(config);

        return sendRoom(
            socket,
            config.room,
            "Welcome Enabled"
        );
    }

    // ================= WC OFF =================

    if (body === "-wc") {

        config.welcome = false;

        saveBot(config);

        return sendRoom(
            socket,
            config.room,
            "Welcome Disabled"
        );
    }

    // ================= SCORE =================

    if (body === "myscore") {

        const scores = loadJSON(
            "./storage/scores.json",
            {}
        );

        if (!scores[from]) {

            return sendRoom(
                socket,
                config.room,
                "No score yet."
            );
        }

        return sendRoom(
            socket,
            config.room,

`${from}
Score: ${scores[from].score}`
        );
    }
}

// ======================================

function sendRoom(socket, room, body) {

    if (
        !socket ||
        socket.readyState !== 1
    ) return;

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body,
        id: packet()
    }));
}

// ======================================

function saveBot(config) {

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

module.exports = {
    start,
    ACTIVE_BOTS
};
