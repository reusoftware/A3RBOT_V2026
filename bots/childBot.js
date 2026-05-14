const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON } = require("./storage");

const activeBots = new Map();

function generatePacketID() {
    return "BOT-" + Date.now();
}

// ============================
// START CHILDBOT
// ============================
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

        socket.on("message", async (data) => {

            console.log("[CHILDBOT RAW]", data.toString());

            let msg;
            try {
                msg = JSON.parse(data);
            } catch {
                return;
            }

            // ================= LOGIN SUCCESS =================
            if (msg.handler === "login_event" && msg.type === "success") {

                console.log(`[CHILDBOT] Login success: ${config.username}`);

                loggedIn = true;

                socket.send(JSON.stringify({
                    handler: "room_join",
                    id: generatePacketID(),
                    name: config.room
                }));
            }

            // ================= LOGIN FAILED =================
            if (msg.handler === "login_event" &&
                (msg.type === "failed" || msg.type === "error")) {

                console.log(`[CHILDBOT] Login FAILED: ${config.username}`);

                resolve({ success: false, stage: "login_failed" });
                socket.close();
            }

            // ================= ROOM JOIN =================
            if (
                msg.handler === "room_event" &&
                (msg.type === "joined" ||
                 msg.type === "user_joined" ||
                 msg.type === "room_joined" ||
                 msg.type === "you_joined")
            ) {
                console.log(`[CHILDBOT] Joined room: ${config.room}`);

                joinedRoom = true;

                QuizSystem.startQuiz(socket, config.room);

                resolve({ success: true, stage: "joined_room" });
            }

            // ================= ROOM MESSAGE =================
            if (msg.handler === "room_event") {
                await handleRoomEvent(socket, config, msg);
            }
        });

        socket.on("error", (err) => {
            console.log("[CHILDBOT ERROR]", err);
            resolve({ success: false, stage: "socket_error" });
        });

        socket.on("close", () => {
            console.log(`[CHILDBOT] Closed: ${config.username}`);
            activeBots.delete(config.username);
        });

        setTimeout(() => {
            if (!loggedIn || !joinedRoom) {
                console.log(`[CHILDBOT] Timeout: ${config.username}`);
                socket.close();
                resolve({ success: false, stage: "timeout" });
            }
        }, 20000);
    });
}

// ================= ROOM EVENTS =================
async function handleRoomEvent(socket, config, msg) {

    if (msg.type === "user_joined") {

        const welcomes = [
            `Welcome ${msg.username}`,
            `Hello ${msg.username}`,
            `Enjoy your stay ${msg.username}`
        ];

        const text = welcomes[Math.floor(Math.random() * welcomes.length)];

        sendRoomMessage(socket, config.room, text);
    }

    if (msg.type === "text") {

        const body = (msg.body || "").toLowerCase();
        const from = msg.from;

        QuizSystem.handleAnswer(socket, config.room, from, body);

        if (body === "myscore") {

            const scores = loadJSON("./storage/scores.json", {});

            const score = scores[from]?.score || 0;

            sendRoomMessage(
                socket,
                config.room,
                `${from} score: ${score}`
            );
        }
    }
}

// ================= SEND MESSAGE =================
function sendRoomMessage(socket, room, body) {

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body,
        id: generatePacketID()
    }));
}

module.exports = { start };
