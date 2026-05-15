const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON } = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let joined = false;
        let alive = true;

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
            if (msg.handler === "login_event" && msg.type === "success") {

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: generatePacketID()
                }));
            }

            // ================= ROOM JOIN =================
            if (msg.handler === "room_event") {

                // ROOM READY
                if (msg.type === "you_joined" && !joined) {

                    joined = true;

                    console.log("[CHILDBOT JOINED ROOM]", config.room);

                    // START QUIZ ONLY ONCE
                    setTimeout(() => {
                        QuizSystem.startQuiz(socket, config.room);
                    }, 1500);

                    resolve({
                        success: true,
                        username: config.username,
                        room: config.room,
                        socket
                    });
                }

                handleRoom(socket, config, msg);
            }

            // LOGIN FAIL
            if (msg.handler === "login_event" && msg.type === "failed") {
                resolve({ success: false });
            }
        });

        socket.on("close", () => {
            console.log("[CHILDBOT CLOSED]", config.username);
            alive = false;
        });

        socket.on("error", (e) => {
            console.log("[CHILDBOT ERROR]", e.message);
        });

        // ================= KEEP ALIVE =================
        setInterval(() => {
            if (socket.readyState === 1 && alive) {
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

    if (!msg.type) return;

    const body = (msg.body || "").toLowerCase().trim();
    const from = msg.from;

    // QUIZ ANSWER
    QuizSystem.handleAnswer(socket, config.room, from, body);

    // HELP
    if (body === "help") {

        send(socket, config.room,
`BOT COMMANDS:
help
myscore
+quiz
-quiz
+wc
-wc
maslist
mas+name
mas-number`);
    }

    // SCORE
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
