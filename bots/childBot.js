const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

// ======================================
// START BOT
// ======================================

function start(config) {

    const socket = new WebSocket(
        "wss://chatp.net:5333/server"
    );

    console.log(
        "[CHILDBOT STARTING]",
        config.username
    );

    // =========================
    // CONNECT
    // =========================

    socket.on("open", () => {

        console.log(
            `[CONNECTED] ${config.username}`
        );

        socket.send(JSON.stringify({
            handler: "login",
            username: config.username,
            password: config.password,
            id: generatePacketID()
        }));

    });

    // =========================
    // RECEIVE MESSAGE
    // =========================

    socket.on("message", async(data) => {

        try {

            const msg = JSON.parse(data);

            console.log(
                "[RAW CHILDBOT]",
                msg
            );

            // =====================
            // LOGIN SUCCESS
            // =====================

            if (
                msg.handler === "login_event" &&
                msg.type === "success"
            ) {

                console.log(
                    `[LOGIN SUCCESS] ${config.username}`
                );

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: generatePacketID()
                }));

                console.log(
                    `[JOINING ROOM] ${config.room}`
                );

                // START QUIZ
                QuizSystem.startQuiz(
                    socket,
                    config.room
                );

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
                    `[LOGIN FAILED] ${config.username}`
                );

            }

            // =====================
            // ROOM EVENT
            // =====================

            if (
                msg.handler === "room_event"
            ) {

                await handleRoomEvent(
                    socket,
                    config,
                    msg
                );

            }

        } catch(err) {

            console.log(
                "[CHILDBOT ERROR]",
                err
            );

        }

    });

    // =========================
    // ERROR
    // =========================

    socket.on("error", (err) => {

        console.log(
            "[SOCKET ERROR]",
            err
        );

    });

    // =========================
    // CLOSE
    // =========================

    socket.on("close", () => {

        console.log(
            `[CLOSED] ${config.username}`
        );

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

    console.log(
        "[ROOM EVENT TYPE]",
        type
    );

    // ==================================
    // USER JOINED
    // ==================================

    if (
        type === "user_joined"
    ) {

        if (config.welcome === false)
            return;

        const welcomes = [

            `Welcome ${msg.username}`,

            `Hello ${msg.username}`,

            `Enjoy your stay ${msg.username}`,

            `Nice to see you ${msg.username}`

        ];

        const random = welcomes[
            Math.floor(
                Math.random() * welcomes.length
            )
        ];

        sendRoomMessage(
            socket,
            config.room,
            random
        );

    }

    // ==================================
    // TEXT MESSAGE
    // ==================================

    if (
        type === "text" ||
        type === "message" ||
        type === "chat"
    ) {

        if (!msg.body) return;

        const body =
            msg.body.toLowerCase().trim();

        const from = msg.from;

        console.log(
            `[ROOM MESSAGE] ${from}: ${body}`
        );

        // ==============================
        // HELP
        // ==============================

        if (body === "help") {

            sendRoomMessage(
                socket,
                config.room,

`BOT COMMANDS

help
@welcome on
@welcome off
@quiz on
@quiz off
myscore`
            );

        }

        // ==============================
        // WELCOME ON
        // ==============================

        if (body === "@welcome on") {

            config.welcome = true;

            sendRoomMessage(
                socket,
                config.room,
                "Welcome enabled."
            );

        }

        // ==============================
        // WELCOME OFF
        // ==============================

        if (body === "@welcome off") {

            config.welcome = false;

            sendRoomMessage(
                socket,
                config.room,
                "Welcome disabled."
            );

        }

        // ==============================
        // QUIZ ON
        // ==============================

        if (body === "@quiz on") {

            config.quiz = true;

            QuizSystem.startQuiz(
                socket,
                config.room
            );

            sendRoomMessage(
                socket,
                config.room,
                "Quiz enabled."
            );

        }

        // ==============================
        // QUIZ OFF
        // ==============================

        if (body === "@quiz off") {

            config.quiz = false;

            sendRoomMessage(
                socket,
                config.room,
                "Quiz disabled."
            );

        }

        // ==============================
        // HANDLE ANSWER
        // ==============================

        if (config.quiz !== false) {

            QuizSystem.handleAnswer(
                socket,
                config.room,
                from,
                body
            );

        }

        // ==============================
        // MYSCORE
        // ==============================

        if (body === "myscore") {

            const scores = loadJSON(
                "./storage/scores.json",
                {}
            );

            if (scores[from]) {

                sendRoomMessage(
                    socket,
                    config.room,
                    `${from} score: ${scores[from].score}`
                );

            } else {

                sendRoomMessage(
                    socket,
                    config.room,
                    `${from} has no score yet.`
                );

            }

        }

    }

}

// ======================================
// SEND ROOM MESSAGE
// ======================================

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

        url: "",

        length: "0",

        id: generatePacketID()

    }));

}

// ======================================

module.exports = {
    start
};
