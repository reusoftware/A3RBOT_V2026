const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function packet() {
    return "BOT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function send(socket, data) {
    if (socket.readyState === 1) {
        socket.send(JSON.stringify(data));
    }
}

function sendRoom(socket, room, body) {
    send(socket, {
        handler: "room_message",
        type: "text",
        room,
        body,
        id: packet()
    });
}

// ===============================
// MAIN START
// ===============================
function start(config) {

    return new Promise((resolve) => {

        if (!config.roomMasters) config.roomMasters = [];
        if (config.welcome === undefined) config.welcome = true;
        if (config.quiz === undefined) config.quiz = false;

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let joined = false;
        let quizStarted = false;

        console.log("[BOT START]", config.username);

        // ================= LOGIN =================
        socket.on("open", () => {

            send(socket, {
                handler: "login",
                username: config.username,
                password: config.password,
                id: packet()
            });

        });

        // ================= MESSAGE =================
        socket.on("message", async (data) => {

            let msg;
            try {
                msg = JSON.parse(data);
            } catch {
                return;
            }

            // LOGIN SUCCESS
            if (msg.handler === "login_event" && msg.type === "success") {

                send(socket, {
                    handler: "room_join",
                    name: config.room,
                    id: packet()
                });
            }

            // ROOM EVENTS
            if (msg.handler === "room_event") {

                if (msg.type === "you_joined" && !joined) {

                    joined = true;

                    console.log("[BOT JOINED]", config.username);

                    // register bot globally
                    global.CHILD_CONNECTED = global.CHILD_CONNECTED || {};
                    global.CHILD_CONNECTED[config.room] = {
                        room: config.room,
                        username: config.username
                    };

                    sendRoom(socket, config.room, "🤖 Bot ready to work!");

                    resolve({ success: true, socket });

                    return;
                }

                handleRoom(socket, config, msg);
            }

        });

        socket.on("close", () => {

            console.log("[BOT CLOSED]", config.username);

            if (global.CHILD_CONNECTED?.[config.room]) {
                delete global.CHILD_CONNECTED[config.room];
            }

        });

        socket.on("error", (err) => {
            console.log("[BOT ERROR]", err.message);
        });

        // KEEP ALIVE (IMPORTANT FIX)
        setInterval(() => {

            send(socket, {
                handler: "ping",
                id: packet()
            });

        }, 20000);

        // ================= ROOM HANDLER =================
        function handleRoom(socket, config, msg) {

            if (msg.type === "user_joined" && config.welcome) {

                const name = msg.username || "User";

                const text = [
                    `Welcome ${name}`,
                    `Hello ${name}`,
                    `Nice to see you ${name}`
                ];

                sendRoom(socket, config.room,
                    text[Math.floor(Math.random() * text.length)]
                );
            }

            if (msg.type !== "text") return;
            if (!msg.body) return;

            const body = msg.body.toLowerCase().trim();
            const from = msg.from;

            const isMaster =
                from === config.owner ||
                config.roomMasters.includes(from);

            // QUIZ CONTROL (SAFE FIX)
            if (body === "@quiz on" && isMaster) {

                config.quiz = true;

                QuizSystem.startQuiz(socket, config.room);

                sendRoom(socket, config.room, "Quiz enabled");
            }

            if (body === "@quiz off" && isMaster) {

                config.quiz = false;

                QuizSystem.stopQuiz(config.room);

                sendRoom(socket, config.room, "Quiz disabled");
            }

            if (config.quiz) {
                QuizSystem.handleAnswer(socket, config.room, from, body);
            }

        }

    });
}

module.exports = { start };
