const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function generateID() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        const socket =
            new WebSocket(
                "wss://chatp.net:5333/server"
            );

        let joined = false;

        // ================= CONNECT =================
        socket.on("open", () => {

            console.log(
                "[BOT CONNECTED]",
                config.username
            );

            socket.send(JSON.stringify({

                handler: "login",

                username: config.username,

                password: config.password,

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

            console.log(
                "[BOT RAW]",
                msg
            );

            // ================= LOGIN =================
            if (
                msg.handler === "login_event"
            ) {

                if (
                    msg.type === "success"
                ) {

                    socket.send(JSON.stringify({

                        handler: "room_join",

                        name: config.room,

                        id: generateID()

                    }));

                }

                if (
                    msg.type === "failed"
                ) {

                    resolve({
                        success: false
                    });

                }

            }

            // ================= ROOM =================
            if (
                msg.handler === "room_event"
            ) {

                // ROOM READY
                if (
                    msg.type === "you_joined" &&
                    !joined
                ) {

                    joined = true;

                    console.log(
                        "[ROOM JOINED]",
                        config.room
                    );

                    sendRoomMessage(
                        socket,
                        config.room,
                        "🤖 Bot Ready!"
                    );

                    // START QUIZ
                    if (
                        config.quiz !== false
                    ) {

                        setTimeout(() => {

                            QuizSystem.startQuiz(
                                socket,
                                config.room
                            );

                        }, 3000);

                    }

                    resolve({
                        success: true
                    });

                }

                handleRoom(
                    socket,
                    config,
                    msg
                );

            }

        });

        // ================= KEEP ALIVE =================
        setInterval(() => {

            if (
                socket.readyState === 1
            ) {

                socket.send(JSON.stringify({

                    handler: "ping",

                    id: generateID()

                }));

            }

        }, 20000);

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

        });

    });

}

// ========================================
// ROOM HANDLER
// ========================================

function handleRoom(
    socket,
    config,
    msg
) {

    const type = msg.type;

    // ================= WELCOME =================
    if (
        type === "user_joined" &&
        config.welcome !== false
    ) {

        sendRoomMessage(
            socket,
            config.room,
            `Welcome ${msg.username}`
        );

    }

    // ================= MESSAGE =================
    if (
        type === "text" ||
        type === "message" ||
        type === "chat"
    ) {

        const body =
            (msg.body || "")
            .toLowerCase()
            .trim();

        const from =
            msg.from;

        if (!body) return;

        console.log(
            "[ROOM CMD]",
            body
        );

        // QUIZ
        if (
            config.quiz !== false
        ) {

            QuizSystem.handleAnswer(
                socket,
                config.room,
                from,
                body
            );

        }

        // HELP
        if (
            body === "help"
        ) {

            return sendRoomMessage(
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

        // QUIZ ON
        if (body === "+quiz") {

            config.quiz = true;

            QuizSystem.startQuiz(
                socket,
                config.room
            );

            return sendRoomMessage(
                socket,
                config.room,
                "Quiz Enabled"
            );

        }

        // QUIZ OFF
        if (body === "-quiz") {

            config.quiz = false;

            return sendRoomMessage(
                socket,
                config.room,
                "Quiz Disabled"
            );

        }

        // WELCOME ON
        if (body === "+wc") {

            config.welcome = true;

            return sendRoomMessage(
                socket,
                config.room,
                "Welcome Enabled"
            );

        }

        // WELCOME OFF
        if (body === "-wc") {

            config.welcome = false;

            return sendRoomMessage(
                socket,
                config.room,
                "Welcome Disabled"
            );

        }

        // SCORE
        if (
            body === "myscore"
        ) {

            const scores =
                loadJSON(
                    "./storage/scores.json",
                    {}
                );

            const s =
                scores[from];

            return sendRoomMessage(
                socket,
                config.room,

                s
                ? `${from} Score: ${s.score}`
                : "No score yet"
            );

        }

    }

}

// ========================================

function sendRoomMessage(
    socket,
    room,
    body
) {

    socket.send(JSON.stringify({

        handler: "room_message",

        type: "text",

        room,

        body,

        id: generateID()

    }));

}

module.exports = {
    start
};
