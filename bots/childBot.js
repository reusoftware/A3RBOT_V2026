const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON } = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let ready = false;
        let loggedIn = false;

        console.log("[CHILDBOT START]", config.username);

        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: generatePacketID()
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
                        id: generatePacketID()
                    }));
                }

                if (msg.type === "failed") {
                    return resolve({
                        success: false,
                        stage: "login_failed"
                    });
                }
            }

            // ================= ROOM JOIN =================
            if (msg.handler === "room_event") {

                if (
                    msg.type === "room_joined" ||
                    msg.type === "joined" ||
                    msg.type === "user_joined"
                ) {

                    if (!ready) {
                        ready = true;

                        console.log("[ROOM READY]", config.room);

                        QuizSystem.startQuiz(socket, config.room);

                        resolve({
                            success: true,
                            stage: "ready"
                        });
                    }
                }

                handleRoom(socket, config, msg);
            }
        });

        socket.on("close", () => {
            console.log("[CHILDBOT CLOSED]", config.username);
        });

        socket.on("error", (e) => {
            console.log("[CHILDBOT ERROR]", e.message);
        });

    });
}

// ================= ROOM HANDLER =================
function handleRoom(socket, config, msg) {

    if (!msg.type) return;

    if (msg.type === "text") {

        const body = (msg.body || "").toLowerCase().trim();
        const from = msg.from;

        QuizSystem.handleAnswer(socket, config.room, from, body);

        // ===== COMMANDS =====
        if (body === "help") {

            socket.send(JSON.stringify({
                handler: "room_message",
                type: "text",
                room: config.room,
                body:
`BOT COMMANDS:
help
myscore
@quiz on/off
@welcome on/off`,
                id: generatePacketID()
            }));
        }

        if (body === "myscore") {

            const scores = loadJSON("./storage/scores.json", {});

            const user = scores[from];

            socket.send(JSON.stringify({
                handler: "room_message",
                type: "text",
                room: config.room,
                body: user
                    ? `${from} score: ${user.score}`
                    : `${from} no score yet`,
                id: generatePacketID()
            }));
        }
    }
}

module.exports = { start };
