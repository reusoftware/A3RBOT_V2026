const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");

const activeBots = new Map();

function generatePacketID() {
    return "BOT-" + Date.now();
}

// ========================================
// START CHILDBOT
// ========================================

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let loggedIn = false;
        let joinedRoom = false;

        activeBots.set(config.username, socket);

        socket.on("open", () => {

            console.log(`[CHILDBOT] Connecting: ${config.username}`);

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

            console.log("[CHILDBOT RAW]", msg);

            // ================= LOGIN SUCCESS =================
            if (
                msg.handler === "login_event" &&
                msg.type === "success"
            ) {

                console.log("[CHILDBOT] Login OK");

                loggedIn = true;

                socket.send(JSON.stringify({
                    handler: "room_join",
                    id: generatePacketID(),
                    name: config.room
                }));
            }

            // ================= LOGIN FAIL =================
            if (
                msg.handler === "login_event" &&
                (msg.type === "failed" || msg.type === "error")
            ) {

                console.log("[CHILDBOT] LOGIN FAILED");

                resolve({
                    success: false,
                    stage: "login_failed"
                });

                socket.close();
            }

            // ================= ROOM EVENTS =================
            if (msg.handler === "room_event") {

                console.log("[CHILDBOT ROOM EVENT]", msg);

                const type = msg.type;

                if (!joinedRoom) {

                    joinedRoom = true;

                    console.log("[CHILDBOT] ROOM JOINED ASSUMED");

                    QuizSystem.startQuiz(socket, config.room);

                    resolve({
                        success: true,
                        stage: "joined_room"
                    });
                }

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
            activeBots.delete(config.username);
        });

        // fallback timeout
        setTimeout(() => {

            if (!loggedIn || !joinedRoom) {

                console.log("[CHILDBOT] TIMEOUT");

                resolve({
                    success: false,
                    stage: "timeout"
                });

                socket.close();
            }

        }, 15000);

    });
}

// ========================================
// ROOM EVENTS
// ========================================

async function handleRoomEvent(socket, config, msg) {

    const type = msg.type;

    if (type === "user_joined") {

        socket.send(JSON.stringify({
            handler: "room_message",
            type: "text",
            room: config.room,
            body: `Welcome ${msg.username}`,
            id: generatePacketID()
        }));
    }

    if (type === "text") {

        const body = (msg.body || "").toLowerCase();
        const from = msg.from;

        QuizSystem.handleAnswer(socket, config.room, from, body);

        if (body === "myscore") {

            socket.send(JSON.stringify({
                handler: "room_message",
                type: "text",
                room: config.room,
                body: `${from} requested score`,
                id: generatePacketID()
            }));
        }
    }
}

module.exports = { start };
