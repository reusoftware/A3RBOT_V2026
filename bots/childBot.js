const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");
const { loadJSON } = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        let socket;

        try {

            socket = new WebSocket("wss://chatp.net:5333/server");

        } catch (err) {
            return resolve({
                success: false,
                stage: "websocket_create_failed"
            });
        }

        let loggedIn = false;
        let joinedRoom = false;

        socket.on("open", () => {

            console.log(`[CHILDBOT] Connecting: ${config.username}`);

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

                console.log(`[CHILDBOT] Login OK: ${config.username}`);

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

            // ROOM JOIN (FIXED CHECK)
            if (msg.handler === "room_event" && msg.type) {

                if (msg.type.includes("join")) {

                    joinedRoom = true;

                    console.log(`[CHILDBOT] Joined room: ${config.room}`);

                    try {
                        QuizSystem.startQuiz(socket, config.room);
                    } catch (err) {
                        console.log("Quiz error:", err);
                    }

                    return resolve({
                        success: true,
                        stage: "joined_room"
                    });
                }
            }

            // ROOM EVENTS
            if (msg.handler === "room_event") {
                handleRoomEvent(socket, config, msg);
            }
        });

        socket.on("error", (err) => {
            console.log("[CHILDBOT ERROR]", err);

            resolve({
                success: false,
                stage: "socket_error"
            });
        });

        socket.on("close", () => {
            console.log(`[CHILDBOT CLOSED] ${config.username}`);
        });

        setTimeout(() => {

            if (!loggedIn || !joinedRoom) {
                console.log(`[CHILDBOT TIMEOUT] ${config.username}`);

                try {
                    socket.close();
                } catch {}

                resolve({
                    success: false,
                    stage: "timeout"
                });
            }

        }, 20000);

    });
}

async function handleRoomEvent(socket, config, msg) {

    try {

        const type = msg.type;

        if (type === "text") {

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

    } catch (err) {
        console.log("ROOM EVENT ERROR:", err);
    }
}

module.exports = { start };
