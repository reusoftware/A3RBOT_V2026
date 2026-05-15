const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON } = require("./storage");

function id() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let loggedIn = false;
        let roomReady = false;
        let quizStarted = false;
        let joinLocked = false;

        console.log("[CHILDBOT START]", config.username);

        // ================= CONNECT =================
        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: id()
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
                        id: id()
                    }));
                }

                if (msg.type === "failed") {
                    return resolve({ success: false });
                }
            }

            // ================= ROOM EVENTS =================
            if (msg.handler === "room_event") {

                // ONLY FIRST JOIN EVENT
                if (msg.type === "you_joined") {

                    if (joinLocked) return;
                    joinLocked = true;

                    roomReady = true;

                    console.log("[ROOM READY]", config.room);

                    // ✅ SEND ONLY ONCE READY MESSAGE
                    socket.send(JSON.stringify({
                        handler: "room_message",
                        type: "text",
                        room: config.room,
                        body: "🤖 I'm a bot and ready to work!",
                        id: id()
                    }));

                    // ✅ START QUIZ ONLY ONCE (DELAYED)
                    setTimeout(() => {

                        if (quizStarted) return;
                        quizStarted = true;

                        QuizSystem.startQuiz(socket, config.room);

                    }, 6000);

                    resolve({
                        success: true,
                        socket,
                        room: config.room,
                        username: config.username
                    });
                }

                // ignore events until stable
                if (!roomReady) return;

                handleRoom(socket, config, msg);
            }
        });

        // ================= CLOSE =================
        socket.on("close", () => {

            console.log("[CHILDBOT CLOSED]", config.username);

            // ❌ IMPORTANT: remove auto spam reconnect (this causes flooding)
            // REMOVE auto restart for now

        });

        socket.on("error", (e) => {
            console.log("[CHILDBOT ERROR]", e.message);
        });

        // ================= KEEP ALIVE =================
        setInterval(() => {

            if (socket.readyState === 1) {
                socket.send(JSON.stringify({
                    handler: "ping",
                    id: id()
                }));
            }

        }, 25000);

    });
}

// ================= ROOM =================
function handleRoom(socket, config, msg) {

    if (msg.type !== "text") return;

    const body = (msg.body || "").trim().toLowerCase();
    const from = msg.from;

    QuizSystem.handleAnswer(socket, config.room, from, body);

    if (body === "help") {

        socket.send(JSON.stringify({
            handler: "room_message",
            type: "text",
            room: config.room,
            body: "help | myscore",
            id: id()
        }));
    }

    if (body === "myscore") {

        const scores = loadJSON("./storage/scores.json", {});
        const u = scores[from];

        socket.send(JSON.stringify({
            handler: "room_message",
            type: "text",
            room: config.room,
            body: u ? `${from} score: ${u.score}` : "No score",
            id: id()
        }));
    }
}

module.exports = { start };
