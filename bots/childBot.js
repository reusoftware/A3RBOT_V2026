const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let isReady = false;

        console.log("[CHILDBOT START]", config.username);

        // =========================
        // OPEN
        // =========================
        socket.on("open", () => {

            console.log("[CHILDBOT CONNECTED]", config.username);

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: generatePacketID()
            }));

        });

        // =========================
        // MESSAGE
        // =========================
        socket.on("message", async (data) => {

            let msg;

            try {
                msg = JSON.parse(data);
            } catch {
                return;
            }

            console.log("[CHILDBOT RAW]", msg);

            // =========================
            // LOGIN SUCCESS
            // =========================
            if (
                msg.handler === "login_event" &&
                msg.type === "success"
            ) {

                console.log("[LOGIN OK]", config.username);

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: generatePacketID()
                }));
            }

            // =========================
            // ROOM JOIN CONFIRM (IMPORTANT FIX)
            // =========================
            if (
                msg.handler === "room_event" &&
                (
                    msg.type === "joined" ||
                    msg.type === "user_joined" ||
                    msg.type === "room_joined"
                )
            ) {

                if (!isReady) {

                    isReady = true;

                    console.log("[ROOM JOINED]", config.room);

                    // NOW SAFE TO START QUIZ
                    setTimeout(() => {

                        try {

                            QuizSystem.startQuiz(
                                socket,
                                config.room
                            );

                        } catch (err) {
                            console.log("[QUIZ ERROR]", err);
                        }

                    }, 1500);

                    resolve({
                        success: true,
                        stage: "joined_room"
                    });
                }
            }

            // =========================
            // ROOM EVENTS
            // =========================
            if (msg.handler === "room_event") {

                handleRoomEvent(socket, config, msg);

            }

            // =========================
            // PRIVATE FAIL SAFE (optional debugging)
            // =========================
            if (msg.handler === "login_event" && msg.type === "failed") {

                console.log("[LOGIN FAILED]", config.username);

                resolve({
                    success: false,
                    stage: "login_failed"
                });
            }

        });

        // =========================
        // ERROR HANDLER
        // =========================
        socket.on("error", (err) => {
            console.log("[CHILDBOT ERROR]", err);
        });

        // =========================
        // CLOSE HANDLER (IMPORTANT DEBUG)
        // =========================
        socket.on("close", () => {
            console.log("[CHILDBOT DISCONNECTED]", config.username);
        });

    });
}

// =========================
// ROOM EVENTS
// =========================
async function handleRoomEvent(socket, config, msg) {

    const type = msg.type;

    // USER JOIN
    if (type === "user_joined") {

        if (config.welcome === false) return;

        const msgList = [
            `Welcome ${msg.username}`,
            `Hello ${msg.username}`,
            `Nice to see you ${msg.username}`
        ];

        const text =
            msgList[Math.floor(Math.random() * msgList.length)];

        sendRoomMessage(socket, config.room, text);
    }

    // TEXT MESSAGE
    if (type === "text") {

        if (!msg.body) return;

        const body = msg.body.toLowerCase();
        const from = msg.from;

        // forward to quiz system
        QuizSystem.handleAnswer(socket, config.room, from, body);

        // simple command test
        if (body === "help") {

            sendRoomMessage(
                socket,
                config.room,
`BOT COMMANDS:
help
myscore
@quiz on/off
@welcome on/off`
            );
        }

        if (body === "myscore") {

            const scores = loadJSON("./storage/scores.json", {});

            if (scores[from]) {

                sendRoomMessage(
                    socket,
                    config.room,
                    `${from} score: ${scores[from].score}`
                );

            } else {

                sendRoomMessage(
                    socket,
                    config.room,
                    `${from} no score yet`
                );
            }
        }
    }
}

// =========================
// SEND MESSAGE
// =========================
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
