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
        let logged = false;

        console.log("[CHILDBOT START]", config.username);

        // ================= CONNECT =================
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

                    logged = true;

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

            // ================= ROOM READY =================
            if (msg.handler === "room_event") {

                if (!ready &&
                    (msg.type === "you_joined" ||
                     msg.type === "user_joined")
                ) {

                    ready = true;

                    console.log("[ROOM READY]", config.room);

                    QuizSystem.startQuiz(socket, config.room);

                    resolve({
                        success: true,
                        stage: "ready"
                    });
                }

                handleRoom(socket, config, msg);
            }
        });

        // ================= KEEP ALIVE FIX =================
        const ping = setInterval(() => {
            if (socket.readyState === 1) {
                socket.send(JSON.stringify({
                    handler: "ping",
                    id: generatePacketID()
                }));
            }
        }, 20000);

        socket.on("close", () => {
            clearInterval(ping);
            console.log("[CHILDBOT CLOSED]", config.username);

            // OPTIONAL AUTO RECONNECT
            setTimeout(() => start(config), 5000);
        });

        socket.on("error", (e) => {
            console.log("[CHILDBOT ERROR]", e.message);
        });

    });
}

// ================= ROOM HANDLER =================
function handleRoom(socket, config, msg) {

    if (msg.type !== "text") return;
    if (!msg.body) return;

    const body = msg.body.trim().toLowerCase();
    const from = msg.from;

    // quiz answer
    QuizSystem.handleAnswer(socket, config.room, from, body);

    // ================= HELP =================
    if (body === "help") {
        send(socket, config.room,
`HELP:
help
myscore
@quiz on/off
@welcome on/off`);
    }

    // ================= SCORE =================
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
