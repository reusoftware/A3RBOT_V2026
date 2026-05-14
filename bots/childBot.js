const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

const activeBots = new Map();

function generatePacketID() {
    return "BOT-" + Date.now();
}

// ============================
// START CHILDBOT
// ============================

function start(config) {

    return new Promise((resolve) => {

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let loggedIn = false;
        let joinedRoom = false;

        activeBots.set(config.username, socket);

        // =========================
        // CONNECT
        // =========================

        socket.on("open", () => {

            console.log(
                `[CHILDBOT] Connecting: ${config.username}`
            );

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: generatePacketID()
            }));

        });

        // =========================
        // MESSAGE HANDLER
        // =========================

        socket.on("message", async(data) => {

            let msg;
  console.log("[RAW CHILD BOT]", data.toString());
            try {
                msg = JSON.parse(data);
            } catch {
                return;
            }

            // =========================
            // LOGIN SUCCESS
            // =========================

            if (
                msg.handler === "login_event" &&
                msg.type === "success"
            ) {

                console.log(
                    `[CHILDBOT] Login success: ${config.username}`
                );

                loggedIn = true;

                socket.send(JSON.stringify({
    handler: "room_join",
    id: generatePacketID(),
    name: config.room
}));

            }

            // =========================
            // LOGIN FAILED
            // =========================

            if (
                msg.handler === "login_event" &&
                (msg.type === "failed" || msg.type === "error")
            ) {

                console.log(
                    `[CHILDBOT] Login FAILED: ${config.username}`
                );

                resolve({
                    success: false,
                    stage: "login_failed"
                });

                socket.close();

            }

            // =========================
            // ROOM JOIN SUCCESS
            // =========================

            if (
                msg.handler === "room_event" &&
             if (
    msg.handler === "room_event" &&
    (
        msg.type === "joined" ||
        msg.type === "user_joined" ||
        msg.type === "room_joined"
    )
) {
            ) {

                console.log(
                    `[CHILDBOT] Joined room: ${config.room}`
                );

                joinedRoom = true;

                // ONLY START QUIZ AFTER JOIN SUCCESS
                QuizSystem.startQuiz(
                    socket,
                    config.room
                );

                resolve({
                    success: true,
                    stage: "joined_room"
                });

            }

            // =========================
            // ROOM EVENTS
            // =========================

            if (
                msg.handler === "room_event"
            ) {

                await handleRoomEvent(
                    socket,
                    config,
                    msg
                );

            }

        });

        // =========================
        // ERROR
        // =========================

        socket.on("error", (err) => {

            console.log("[CHILDBOT ERROR]", err);

            resolve({
                success: false,
                stage: "socket_error"
            });

        });

        // =========================
        // CLOSE
        // =========================

        socket.on("close", () => {

            console.log(
                `[CHILDBOT] Closed: ${config.username}`
            );

            activeBots.delete(config.username);

        });

        // =========================
        // TIMEOUT SAFETY
        // =========================

        setTimeout(() => {

            if (!loggedIn || !joinedRoom) {

                console.log(
                    `[CHILDBOT] Timeout: ${config.username}`
                );

                resolve({
                    success: false,
                    stage: "timeout"
                });

                socket.close();

            }

        }, 15000);

    });

}

// ============================
// ROOM EVENTS
// ============================

async function handleRoomEvent(socket, config, msg) {

    const type = msg.type;

    if (type === "user_joined") {

        const welcomes = [
            `Welcome ${msg.username}`,
            `Hello ${msg.username}`,
            `Enjoy your stay ${msg.username}`,
            `Nice to see you ${msg.username}`
        ];

        const random =
            welcomes[Math.floor(Math.random() * welcomes.length)];

        sendRoomMessage(
            socket,
            config.room,
            random
        );

    }

    if (type === "text") {

        const body = msg.body.toLowerCase();
        const from = msg.from;

        QuizSystem.handleAnswer(
            socket,
            config.room,
            from,
            body
        );

        if (body === "myscore") {

            const scores = loadJSON(
                "./storage/scores.json",
                {}
            );

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
                    `${from} has no score yet.`
                );

            }

        }

    }

}

// ============================
// SEND MESSAGE
// ============================

function sendRoomMessage(socket, room, body) {

    socket.send(JSON.stringify({

        handler: "room_message",
        type: "text",
        room,
        body,
        url: "",
        length: "0",
        id: generatePacketID()

    }));

}

module.exports = {
    start
};
