const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function packet() {
    return "BOT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function start(config) {

    return new Promise((resolve) => {

        let joined = false;

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        console.log("[BOT START]", config.username);

        // ================= OPEN =================

        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: packet()
            }));
        });

        // ================= MESSAGE =================

        socket.on("message", (data) => {

            let msg;

            try {
                msg = JSON.parse(data.toString());
            } catch {
                return;
            }

            // ================= LOGIN =================

            if (
                msg.handler === "login_event" &&
                msg.type === "success"
            ) {

                console.log("[LOGIN OK]", config.username);

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: packet()
                }));
            }

            // ================= LOGIN FAILED =================

            if (
                msg.handler === "login_event" &&
                msg.type === "failed"
            ) {

                return resolve({
                    success: false
                });
            }

            // ================= ROOM EVENTS =================

            if (msg.handler === "room_event") {

                // ROOM READY
                if (
                    msg.type === "you_joined" &&
                    !joined
                ) {

                    joined = true;

                    console.log("[ROOM READY]", config.room);

                    sendRoom(
                        socket,
                        config.room,
                        "🤖 Bot Online"
                    );

                    // start quiz AFTER room ready
                    if (config.quiz !== false) {

                        setTimeout(() => {

                            QuizSystem.startQuiz(
                                socket,
                                config.room
                            );

                        }, 5000);
                    }

                    resolve({
                        success: true,
                        bot: {
                            socket,
                            config
                        }
                    });

                    return;
                }

                // user joined
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

                // text
                if (msg.type === "text") {

                    handleCommands(
                        socket,
                        config,
                        msg
                    );
                }
            }
        });

        // ================= CLOSE =================

        socket.on("close", () => {

            console.log("[BOT CLOSED]", config.username);

            setTimeout(() => {
                start(config);
            }, 5000);
        });

        // ================= ERROR =================

        socket.on("error", (e) => {
            console.log("[BOT ERROR]", e.message);
        });

        // ================= KEEP ALIVE =================

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
// COMMANDS
// =====================================

function handleCommands(socket, config, msg) {

    const body = (msg.body || "")
        .trim()
        .toLowerCase();

    const from = msg.from;

    if (!body) return;

    // quiz answers
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
-wc
maslist
mas+username
mas-number`
        );
    }

    // ================= QUIZ =================

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
            "Quiz enabled"
        );
    }

    if (body === "-quiz") {

        config.quiz = false;

        saveBot(config);

        return sendRoom(
            socket,
            config.room,
            "Quiz disabled"
        );
    }

    // ================= WELCOME =================

    if (body === "+wc") {

        config.welcome = true;

        saveBot(config);

        return sendRoom(
            socket,
            config.room,
            "Welcome enabled"
        );
    }

    if (body === "-wc") {

        config.welcome = false;

        saveBot(config);

        return sendRoom(
            socket,
            config.room,
            "Welcome disabled"
        );
    }

    // ================= SCORE =================

    if (body === "myscore") {

        const scores = loadJSON(
            "./storage/scores.json",
            {}
        );

        const s = scores[from];

        if (!s) {

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

Score: ${s.score}`
        );
    }
}

// =====================================

function sendRoom(socket, room, body) {

    if (socket.readyState !== 1) return;

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body,
        id: packet()
    }));
}

// =====================================

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

module.exports = { start };
