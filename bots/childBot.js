const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON } = require("./storage");

const ACTIVE_BOTS = new Map();

function id() {
    return "BOT-" + Date.now();
}

function start(config) {

    // ❗ PREVENT DUPLICATE INSTANCE
    if (ACTIVE_BOTS.has(config.username)) {
        console.log("[BLOCKED DUPLICATE BOT]", config.username);
        return Promise.resolve({
            success: false,
            reason: "duplicate_instance"
        });
    }

    ACTIVE_BOTS.set(config.username, true);

    return new Promise((resolve) => {

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let loggedIn = false;
        let joinedRoom = false;
        let quizStarted = false;

        console.log("[CHILDBOT START]", config.username);

        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: id()
            }));

        });

        socket.on("message", (data) => {

            let msg;
            try {
                msg = JSON.parse(data);
            } catch {
                return;
            }

            // ================= LOGIN =================
            if (msg.handler === "login_event") {

                if (msg.type === "success") {

                    loggedIn = true;

                    socket.send(JSON.stringify({
                        handler: "room_join",
                        name: config.room,
                        id: id()
                    }));
                }

                if (msg.type === "failed") {

                    ACTIVE_BOTS.delete(config.username);

                    return resolve({
                        success: false,
                        reason: "login_failed"
                    });
                }
            }

            // ================= ROOM =================
            if (msg.handler === "room_event") {

                if (msg.type === "you_joined") {

                    if (joinedRoom) return;
                    joinedRoom = true;

                    console.log("[ROOM JOINED]", config.room);

                    // ✔ ONLY ONE READY MESSAGE
                    socket.send(JSON.stringify({
                        handler: "room_message",
                        type: "text",
                        room: config.room,
                        body: "🤖 Bot online and ready!",
                        id: id()
                    }));

                    // ✔ START QUIZ ONCE ONLY
                    if (!quizStarted) {

                        quizStarted = true;

                        setTimeout(() => {

                            QuizSystem.startQuiz(socket, config.room);

                        }, 5000);
                    }

                    return resolve({
                        success: true,
                        socket,
                        room: config.room,
                        username: config.username
                    });
                }

                handleRoom(socket, config, msg);
            }
        });

        socket.on("close", () => {

            console.log("[CHILDBOT CLOSED]", config.username);

            ACTIVE_BOTS.delete(config.username);

        });

        socket.on("error", (e) => {

            console.log("[CHILDBOT ERROR]", e.message);

            ACTIVE_BOTS.delete(config.username);

        });

    });
}

// ================= ROOM =================
function handleRoom(socket, config, msg) {

    if (msg.type !== "text") return;

    const body = (msg.body || "").trim().toLowerCase();
    const from = msg.from;

    QuizSystem.handleAnswer(socket, config.room, from, body);

    if (body === "help") {

        socket.send(JSON.stringify({
            handler: "room_message",
            type: "text",
            room: config.room,
            body: "help | myscore",
            id: id()
        }));
    }

    if (body === "myscore") {

        const scores = loadJSON("./storage/scores.json", {});
        const u = scores[from];

        socket.send(JSON.stringify({
            handler: "room_message",
            type: "text",
            room: config.room,
            body: u ? `${from} score: ${u.score}` : "No score yet",
            id: id()
        }));
    }
}

module.exports = { start, ACTIVE_BOTS };
