const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function packet() {
    return "BOT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function start(config) {

    return new Promise((resolve) => {

        if (!config.roomMasters) config.roomMasters = [];
        if (config.welcome === undefined) config.welcome = true;
        if (config.quiz === undefined) config.quiz = false;

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let joined = false;
        let ready = false;
        let quizStarted = false;

        console.log("[CHILDBOT START]", config.username);

        socket.on("open", () => {
            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: packet()
            }));
        });

        socket.on("message", async (data) => {

            let msg;
            try {
                msg = JSON.parse(data.toString());
            } catch {
                return;
            }

            // ================= LOGIN =================
            if (msg.handler === "login_event" && msg.type === "success") {

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: packet()
                }));
            }

            // ================= ROOM JOIN CONFIRM =================
            if (msg.handler === "room_event" && msg.type === "you_joined") {
 
                setTimeout(() => {
                if (joined) return;
                joined = true;
                ready = true;

                console.log("[CHILDBOT READY]", config.username);

                global.CHILD_CONNECTED = global.CHILD_CONNECTED || {};
                global.CHILD_CONNECTED[config.room] = {
                    room: config.room,
                    username: config.username
                };

                // IMPORTANT: delay bot messages (prevents kick)
              ///  setTimeout(() => {
                    sendRoomMessage(socket, config.room, "Im a Bot and ready to work!");
                }, 1500);

                resolve({
                    success: true,
                    socket
                });

                return;
            }

            if (!ready) return;

            if (msg.handler === "room_event") {
                handleRoomEvent(socket, config, msg);
            }
        });

        socket.on("close", () => {
            console.log("[CHILDBOT CLOSED]", config.username);

            delete global.CHILD_CONNECTED?.[config.room];

            setTimeout(() => {
                start(config);
            }, 8000);
        });

        socket.on("error", (err) => {
            console.log("[CHILDBOT ERROR]", err.message);
        });

        function sendRoomMessage(socket, room, body) {
            if (!socket || socket.readyState !== 1) return;

            socket.send(JSON.stringify({
                handler: "room_message",
                type: "text",
                room,
                body,
                id: packet()
            }));
        }

        function handleRoomEvent(socket, config, msg) {

            const type = msg.type;

            if (type === "user_joined" && config.welcome) {

                const u = msg.username || "User";

                sendRoomMessage(socket, config.room,
                    `Welcome ${u}`
                );
            }

            if (type !== "text") return;
            if (!msg.body) return;

            const body = msg.body.toLowerCase().trim();
            const from = msg.from;

            const isMaster = from === config.owner ||
                config.roomMasters.includes(from);

            if (body === "@quiz on" && isMaster) {

                if (quizStarted) return;
                quizStarted = true;

                QuizSystem.startQuiz(socket, config.room);
            }

            if (body === "@quiz off" && isMaster) {

                quizStarted = false;
                QuizSystem.stopQuiz(config.room);
            }

            if (quizStarted) {
                QuizSystem.handleAnswer(socket, config.room, from, body);
            }
        }
    });
}

module.exports = { start };
