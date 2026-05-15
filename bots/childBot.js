const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function packet() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let ready = false;

        console.log("[CHILDBOT START]", config.username);

        socket.on("open", () => {

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: packet()
            }));
        });

        socket.on("message", (data) => {

            let msg;
            try {
                msg = JSON.parse(data);
            } catch { return; }

            // LOGIN OK
            if (msg.handler === "login_event" && msg.type === "success") {

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: packet()
                }));
            }

            // ROOM READY (IMPORTANT FIX)
            if (msg.handler === "room_event" && msg.type === "you_joined") {

                if (!ready) {
                    ready = true;

                    console.log("[ROOM READY]", config.room);

                    // SAFE START QUIZ (DELAYED)
                    setTimeout(() => {
                        QuizSystem.startQuiz(socket, config.room);
                    }, 3000);

                    resolve({
                        success: true,
                        bot: socket
                    });

                    // FIRST MESSAGE ONLY
                    send(socket, config.room, "🤖 Bot Ready to Work");
                }
            }

            if (msg.handler === "room_event") {
                handleRoom(socket, config, msg);
            }
        });

        socket.on("close", () => {
            console.log("[CHILDBOT CLOSED]", config.username);
        });

    });
}

// ================= ROOM =================
function handleRoom(socket, config, msg) {

    if (msg.type !== "text") return;

    const body = (msg.body || "").toLowerCase().trim();
    const from = msg.from;

    QuizSystem.handleAnswer(socket, config.room, from, body);

    if (body === "help") {
        send(socket, config.room, "help mysocre");
    }

    if (body === "myscore") {

        const scores = loadJSON("./storage/scores.json", {});
        const u = scores[from];

        send(socket, config.room,
            u ? `${from}: ${u.score}` : "No score"
        );
    }
}

function send(socket, room, body) {
    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body,
        id: packet()
    }));
}

module.exports = { start };
