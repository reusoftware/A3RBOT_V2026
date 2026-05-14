const WebSocket = require("ws");

let QuizSystem;
let loadJSON;

try {
    QuizSystem = require("./quizSystem");
} catch (e) {
    QuizSystem = { startQuiz: () => {}, handleAnswer: () => {} };
}

try {
    ({ loadJSON } = require("./storage"));
} catch (e) {
    loadJSON = () => ({});
}

function generatePacketID() {
    return "BOT-" + Date.now();
}

function safeParse(data) {
    try {
        if (!data) return null;
        return JSON.parse(data.toString());
    } catch (e) {
        return null;
    }
}

function start(config) {

    return new Promise((resolve) => {

        let resolved = false;
        let loggedIn = false;
        let joinedRoom = false;

        const socket = new WebSocket("wss://chatp.net:5333/server");

        function done(result) {
            if (resolved) return;
            resolved = true;
            resolve(result);
        }

        socket.on("open", () => {

            console.log("[CHILDBOT] OPEN:", config.username);

            try {
                socket.send(JSON.stringify({
                    handler: "login",
                    username: config.username,
                    password: config.password,
                    id: generatePacketID()
                }));
            } catch (e) {
                done({ success: false, stage: "send_login_failed" });
            }
        });

        socket.on("message", (data) => {

            const msg = safeParse(data);
            if (!msg) return;

            console.log("[CHILDBOT RAW]", msg);

            try {

                // LOGIN SUCCESS
                if (msg.handler === "login_event" && msg.type === "success") {

                    loggedIn = true;

                    socket.send(JSON.stringify({
                        handler: "room_join",
                        name: config.room,
                        id: generatePacketID()
                    }));
                }

                // LOGIN FAILED
                if (msg.handler === "login_event" &&
                    (msg.type === "failed" || msg.type === "error")) {

                    return done({
                        success: false,
                        stage: "login_failed"
                    });
                }

                // ROOM EVENTS
                if (msg.handler === "room_event") {

                    if (
                        msg.type === "joined" ||
                        msg.type === "user_joined" ||
                        msg.type === "room_joined" ||
                        msg.type === "you_joined"
                    ) {

                        joinedRoom = true;

                        try {
                            QuizSystem.startQuiz(socket, config.room);
                        } catch (e) {
                            console.log("[QUIZ ERROR]", e);
                        }

                        return done({
                            success: true,
                            stage: "joined_room"
                        });
                    }

                    if (msg.type === "text") {

                        const body = (msg.body || "").toLowerCase();
                        const from = msg.from;

                        try {
                            QuizSystem.handleAnswer(socket, config.room, from, body);
                        } catch (e) {
                            console.log("[ANSWER ERROR]", e);
                        }

                        if (body === "myscore") {

                            const scores = loadJSON("./storage/scores.json", {});
                            const score = scores[from]?.score || 0;

                            try {
                                socket.send(JSON.stringify({
                                    handler: "room_message",
                                    type: "text",
                                    room: config.room,
                                    body: `${from} score: ${score}`,
                                    id: generatePacketID()
                                }));
                            } catch (e) {
                                console.log("[SEND ERROR]", e);
                            }
                        }
                    }
                }

            } catch (e) {
                console.log("[CHILDBOT LOOP ERROR]", e);
            }
        });

        socket.on("error", (err) => {
            console.log("[CHILDBOT SOCKET ERROR]", err?.message || err);
        });

        socket.on("close", () => {
            console.log("[CHILDBOT CLOSED]");
        });

        setTimeout(() => {

            if (!resolved) {

                try { socket.close(); } catch {}

                done({
                    success: false,
                    stage: "timeout_or_no_join"
                });
            }

        }, 30000);
    });
}

module.exports = { start };
