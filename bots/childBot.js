const WebSocket = require("ws");

let QuizSystem;
let storage;

try {
    QuizSystem = require("./quizSystem");
} catch (e) {
    console.log("[WARN] quizSystem missing");
    QuizSystem = {
        startQuiz: () => {},
        handleAnswer: () => {}
    };
}

try {
    storage = require("./storage");
} catch (e) {
    console.log("[WARN] storage missing");
    storage = {
        loadJSON: () => ({}),
        saveJSON: () => {}
    };
}

const activeBots = new Map();

function generatePacketID() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        if (!config?.username || !config?.password || !config?.room) {
            console.log("[CHILDBOT] INVALID CONFIG", config);
            return resolve({ success: false, stage: "invalid_config" });
        }

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let loggedIn = false;
        let joinedRoom = false;

        activeBots.set(config.username, socket);

        socket.on("open", () => {
            console.log("[CHILDBOT] CONNECTED", config.username);

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: generatePacketID()
            }));
        });

        socket.on("message", async (data) => {

            let msg;

            try {
                msg = JSON.parse(data);
            } catch (e) {
                return;
            }

            try {

                // LOGIN SUCCESS
                if (msg.handler === "login_event" && msg.type === "success") {

                    loggedIn = true;

                    console.log("[CHILDBOT] LOGIN OK");

                    socket.send(JSON.stringify({
                        handler: "room_join",
                        name: config.room,
                        id: generatePacketID()
                    }));
                }

                // LOGIN FAILED
                if (msg.handler === "login_event" &&
                    (msg.type === "failed" || msg.type === "error")) {

                    console.log("[CHILDBOT] LOGIN FAILED");

                    return resolve({
                        success: false,
                        stage: "login_failed"
                    });
                }

                // ROOM EVENTS
                if (msg.handler === "room_event") {

                    // JOIN CONFIRM (safe check)
                    if (
                        msg.type === "joined" ||
                        msg.type === "user_joined" ||
                        msg.type === "room_joined" ||
                        msg.type === "you_joined"
                    ) {
                        joinedRoom = true;

                        console.log("[CHILDBOT] JOINED ROOM");

                        QuizSystem.startQuiz(socket, config.room);

                        resolve({
                            success: true,
                            stage: "joined_room"
                        });
                    }

                    // TEXT
                    if (msg.type === "text") {

                        const body = (msg.body || "").toLowerCase();
                        const from = msg.from;

                        QuizSystem.handleAnswer(socket, config.room, from, body);

                        if (body === "myscore") {

                            const scores = storage.loadJSON("./storage/scores.json", {});

                            const score = scores[from]?.score || 0;

                            socket.send(JSON.stringify({
                                handler: "room_message",
                                type: "text",
                                room: config.room,
                                body: `${from} score: ${score}`,
                                id: generatePacketID()
                            }));
                        }
                    }
                }

            } catch (err) {
                console.log("[CHILDBOT LOOP ERROR]", err);
            }
        });

        socket.on("error", (err) => {
            console.log("[CHILDBOT SOCKET ERROR]", err?.message || err);
        });

        socket.on("close", () => {
            console.log("[CHILDBOT CLOSED]", config.username);
            activeBots.delete(config.username);
        });

        setTimeout(() => {

            if (!loggedIn || !joinedRoom) {

                console.log("[CHILDBOT TIMEOUT]");

                try { socket.close(); } catch {}

                return resolve({
                    success: false,
                    stage: "timeout"
                });
            }

        }, 20000);

    });
}

module.exports = { start };
