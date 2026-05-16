const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function packet() {
    return "BOT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

// ========================= SAFE SEND =========================

function sendRoomMessage(socket, room, body) {

    if (!socket || socket.readyState !== 1) return;

    const msg = {
        handler: "room_message",
        type: "text",
        id: packet(),
        body: String(body),
        room: room,
        url: null,      // IMPORTANT FIX
        length: String(body.length)
    };

    socket.send(JSON.stringify(msg));
}

// ========================= START =========================

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let joined = false;
        let ready = false;
        let resolved = false;

        console.log("[BOT START]", config.username);

        // ================= OPEN =================

        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: packet()
            }));

        });

        // ================= MESSAGE =================

        socket.on("message", async (data) => {

            let msg;
            try {
                msg = JSON.parse(data.toString());
            } catch {
                return;
            }

            // ================= LOGIN =================

            if (msg.handler === "login_event") {

                if (msg.type === "success") {

                    socket.send(JSON.stringify({
                        handler: "room_join",
                        name: config.room,
                        id: packet()
                    }));

                } else {

                    if (!resolved) {
                        resolved = true;
                        resolve({ success: false });
                    }
                }
            }

            // ================= ROOM JOIN CONFIRMED =================

            if (
                msg.handler === "room_event" &&
                (msg.type === "you_joined" )
            ) {

                if (joined) return;
                joined = true;

                console.log("[ROOM JOINED]", config.room);

                // 🔥 CRITICAL FIX: WAIT BEFORE ANY MESSAGE
                setTimeout(() => {

                    sendRoomMessage(
                        socket,
                        config.room,
                        "Im a Bot and ready to work!"
                    );

                }, 5000);

                // START QUIZ AFTER STABLE CONNECTION
                setTimeout(() => {

                ///    if (config.quiz) {
                ///        QuizSystem.startQuiz(socket, config.room);
                ///    }

                }, 12000);

                if (!resolved) {
                    resolved = true;
                    resolve({ success: true, socket });
                }
            }

            // ================= ROOM EVENTS =================

            if (msg.handler === "room_event") {
                handleRoom(socket, config, msg);
            }
        });

        // ================= CLOSE =================

        socket.on("close", () => {
            console.log("[BOT CLOSED]", config.username);
        });

        socket.on("error", (err) => {
            console.log("[BOT ERROR]", err.message);
        });

        // ================= KEEP ALIVE =================

        setInterval(() => {

            if (socket.readyState === 1) {
                socket.send(JSON.stringify({
                    handler: "ping",
                    id: packet()
                }));
            }

        }, 30000);

    });
}

// ================= ROOM EVENTS =================

function handleRoom(socket, config, msg) {

    const type = msg.type;

    if (type === "user_joined") {

        if (!config.welcome) return;

        const user = msg.username || "User";

        setTimeout(() => {

            sendRoomMessage(socket, config.room, `Welcome ${user}`);

        }, 2000);
    }

    if (type !== "text" && type !== "message" && type !== "chat") return;

    if (!msg.body) return;

    const body = msg.body.toLowerCase().trim();
    const from = msg.from || "";

    const isMaster =
        from === config.owner ||
        (config.roomMasters || []).includes(from);

    if (body === "@quiz on" && isMaster) {
        config.quiz = true;
        QuizSystem.startQuiz(socket, config.room);
        sendRoomMessage(socket, config.room, "Quiz enabled");
    }

    if (body === "@quiz off" && isMaster) {
        config.quiz = false;
        QuizSystem.stopQuiz(config.room);
        sendRoomMessage(socket, config.room, "Quiz disabled");
    }

    if (config.quiz) {
        QuizSystem.handleAnswer(socket, config.room, from, body);
    }
}

module.exports = { start };
