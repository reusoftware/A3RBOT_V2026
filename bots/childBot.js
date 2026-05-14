const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");
const { loadJSON } = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let loggedIn = false;
        let joinedRoom = false;

        socket.on("open", () => {

            console.log(`[CHILDBOT] connecting ${config.username}`);

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: generatePacketID()
            }));
        });

        socket.on("message", async (data) => {

            let msg;

            try {
                msg = JSON.parse(data);
            } catch {
                return;
            }

            console.log("[CHILDBOT RAW]", msg);

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

                return resolve({
                    success: false,
                    stage: "login_failed"
                });
            }

            // ROOM JOIN (FIXED LOGIC)
            if (msg.handler === "room_event") {

                if (
                    msg.type === "joined" ||
                    msg.type === "user_joined" ||
                    msg.type === "room_joined" ||
                    msg.type === "you_joined"
                ) {

                    joinedRoom = true;

                    QuizSystem.startQuiz(socket, config.room);

                    return resolve({
                        success: true,
                        stage: "joined_room"
                    });
                }

                // TEXT MESSAGE
                if (msg.type === "text") {

                    const body = (msg.body || "").toLowerCase();
                    const from = msg.from;

                    QuizSystem.handleAnswer(socket, config.room, from, body);

                    if (body === "myscore") {

                        const scores = loadJSON("./storage/scores.json", {});

                        const score = scores[from]?.score || 0;

                        socket.send(JSON.stringify({
                            handler: "room_message",
                            type: "text",
                            room: config.room,
                            body: `${from} score: ${score}`,
                            id: generatePacketID()
                        }));
                    }
                }
            }
        });

        socket.on("error", (err) => {
            console.log("[CHILDBOT ERROR]", err);
        });

        socket.on("close", () => {
            console.log("[CHILDBOT CLOSED]");
        });

        // TIMEOUT FIX (IMPORTANT)
        setTimeout(() => {

            if (!loggedIn || !joinedRoom) {

                try { socket.close(); } catch {}

                return resolve({
                    success: false,
                    stage: "timeout"
                });
            }

        }, 20000);
    });
}

module.exports = { start };
