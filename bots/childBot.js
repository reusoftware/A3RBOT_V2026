const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON
} = require("./storage");

// ======================================
// ACTIVE SOCKETS
// ======================================

const ACTIVE_BOTS = new Map();

// ======================================
// PACKET ID
// ======================================

function generatePacketID() {

    return "BOT-" + Date.now();

}

// ======================================
// START BOT
// ======================================

function start(config) {

    return new Promise((resolve) => {

        try {

            const socket = new WebSocket(
                "wss://chatp.net:5333/server"
            );

            let resolved = false;

            // SAVE SOCKET
            ACTIVE_BOTS.set(
                config.username,
                socket
            );

            console.log(
                "[CHILDBOT START]",
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
            // MESSAGE
            // =========================

            socket.on("message", async(data) => {

                try {

                    const text =
                        data.toString();

                    console.log(
                        "[RAW CHILDBOT]",
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
                            `[LOGIN SUCCESS] ${config.username}`
                        );

                        socket.send(JSON.stringify({

                            handler: "room_join",

                            name: config.room,

                            id: generatePacketID()

                        }));

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

                        if (!resolved) {

                            resolved = true;

                            resolve({
                                success: false
                            });

                        }

                        socket.close();

                    }

                    // =====================
                    // ROOM JOIN SUCCESS
                    // =====================

                    if (
                        msg.handler === "room_event"
                    ) {

                        // DETECT JOINED
                        if (
                            msg.type === "user_joined" ||
                            msg.type === "joined" ||
                            msg.type === "room_joined"
                        ) {

                            console.log(
                                `[ROOM JOINED] ${config.room}`
                            );

                            // START QUIZ SAFELY
                            try {

                                if (
                                    config.quiz !== false
                                ) {

                                    QuizSystem.startQuiz(
                                        socket,
                                        config.room
                                    );

                                }

                            } catch(err) {

                                console.log(
                                    "QUIZ ERROR:",
                                    err
                                );

                            }

                            if (!resolved) {

                                resolved = true;

                                resolve({
                                    success: true
                                });

                            }

                        }

                        // HANDLE ROOM EVENTS
                        await handleRoomEvent(
                            socket,
                            config,
                            msg
                        );

                    }

                } catch(err) {

                    console.log(
                        "[MESSAGE ERROR]",
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
                    `[DISCONNECTED] ${config.username}`
                );

                ACTIVE_BOTS.delete(
                    config.username
                );

            });

            // =========================
            // TIMEOUT
            // =========================

            setTimeout(() => {

                if (!resolved) {

                    resolved = true;

                    console.log(
                        `[TIMEOUT] ${config.username}`
                    );

                    resolve({
                        success: false
                    });

                }

            }, 15000);

        } catch(err) {

            console.log(
                "[START ERROR]",
                err
            );

            resolve({
                success: false
            });

        }

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

    try {

        const type =
            msg.type;

        // =========================
        // USER JOINED
        // =========================

        if (
            type === "user_joined"
        ) {

            if (
                config.welcome === false
            ) return;

            const welcomes = [

                `Welcome ${msg.username}`,

                `Hello ${msg.username}`,

                `Enjoy your stay ${msg.username}`,

                `Nice to see you ${msg.username}`

            ];

            const random =
                welcomes[
                    Math.floor(
                        Math.random() *
                        welcomes.length
                    )
                ];

            sendRoomMessage(
                socket,
                config.room,
                random
            );

        }

        // =========================
        // TEXT MESSAGE
        // =========================

        if (
            type === "text"
        ) {

            if (!msg.body) return;

            const body =
                msg.body
                .toLowerCase()
                .trim();

            const from =
                msg.from;

            // QUIZ ANSWER
            if (
                config.quiz !== false
            ) {

                try {

                    QuizSystem.handleAnswer(
                        socket,
                        config.room,
                        from,
                        body
                    );

                } catch(err) {

                    console.log(
                        "ANSWER ERROR:",
                        err
                    );

                }

            }

            // MYSCORE
            if (
                body === "myscore"
            ) {

                const scores =
                    loadJSON(
                        "./storage/scores.json",
                        {}
                    );

                if (
                    scores[from]
                ) {

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

    } catch(err) {

        console.log(
            "[ROOM EVENT ERROR]",
            err
        );

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

    try {

        socket.send(JSON.stringify({

            handler: "room_message",

            type: "text",

            room,

            body,

            url: "",

            length: "0",

            id: generatePacketID()

        }));

    } catch(err) {

        console.log(
            "SEND MESSAGE ERROR:",
            err
        );

    }

}

// ======================================

module.exports = {
    start
};
