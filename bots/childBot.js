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
        let roomReady = false;

        console.log("[CHILDBOT START]", config.username);

        // ================= CONNECTION =================
        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: generatePacketID()
            }));

        });

        // ================= MESSAGE =================
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
                    return resolve({ success: false });
                }
            }

            // ================= ROOM EVENT =================
            if (msg.handler === "room_event") {

                // 🔴 ONLY TRUST TEXT EVENTS AFTER READY
                if (!roomReady) {

                    if (msg.type === "you_joined") {

                        roomReady = true;

                        console.log("[ROOM READY]", config.room);

                        // ⚠️ START QUIZ ONLY ONCE ROOM IS READY
                        setTimeout(() => {
                            QuizSystem.startQuiz(socket, config.room);
                        }, 2000);

                        resolve({ success: true });
                    }

                    return;
                }

                handleRoom(socket, config, msg);
            }
        });

        socket.on("close", () => {
            console.log("[CHILDBOT CLOSED]", config.username);

            // 🔥 AUTO RECONNECT FIX
            setTimeout(() => {
                start(config);
            }, 5000);
        });

        socket.on("error", (e) => {
            console.log("[CHILDBOT ERROR]", e.message);
        });

        // 🔥 KEEP ALIVE (VERY IMPORTANT)
        setInterval(() => {
            if (socket.readyState === 1) {
                socket.send(JSON.stringify({
                    handler: "ping",
                    id: generatePacketID()
                }));
            }
        }, 20000);

    });
}

// ================= ROOM HANDLER =================
function handleRoom(socket, config, msg) {

    if (msg.type !== "text") return;
    if (!msg.body) return;

    const body = msg.body.trim().toLowerCase();
    const from = msg.from;

    // QUIZ
    QuizSystem.handleAnswer(socket, config.room, from, body);

    // ================= HELP =================
    if (body === "help") {

        send(socket, config.room,
`BOT COMMANDS:
help
myscore
@quiz on/off
@welcome on/off`);
    }

    // ================= MYSCORE =================
    if (body === "myscore") {

        const scores = loadJSON("./storage/scores.json", {});
        const user = scores[from];

        send(socket, config.room,
            user
                ? `${from} score: ${user.score}`
                : `${from} no score yet`
        );
    }
}

// ================= SEND =================
function send(socket, room, body) {

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body,
        id: generatePacketID()
    }));
}

module.exports = { start };
