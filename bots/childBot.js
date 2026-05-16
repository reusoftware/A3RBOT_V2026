const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");

const ACTIVE = global.__CHILD_ACTIVE || (global.__CHILD_ACTIVE = {});

function packet() {
    return "BOT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function send(socket, data) {
    if (socket && socket.readyState === 1) {
        socket.send(JSON.stringify(data));
    }
}

function start(config) {

    const key = `${config.username}@${config.room}`;

    // ❌ BLOCK DUPLICATE BOT INSTANCE
    if (ACTIVE[key]) {
        console.log("[BLOCK DUPLICATE BOT]", key);
        return Promise.resolve({
            success: true,
            socket: ACTIVE[key].socket
        });
    }

    const socket = new WebSocket("wss://chatp.net:5333/server");

    let joined = false;

    console.log("[BOT START]", key);

    ACTIVE[key] = { socket, config };

    socket.on("open", () => {

        send(socket, {
            handler: "login",
            username: config.username,
            password: config.password,
            id: packet()
        });

    });

    socket.on("message", async (data) => {

        let msg;
        try {
            msg = JSON.parse(data);
        } catch {
            return;
        }

        if (msg.handler === "login_event" && msg.type === "success") {

            send(socket, {
                handler: "room_join",
                name: config.room,
                id: packet()
            });
        }

        if (msg.handler === "room_event") {

            // ❌ HANDLE KICK / INVALID JOIN
            if (
                msg.type === "you_kicked" ||
                msg.type === "not_allowed" ||
                msg.type === "room_closed"
            ) {
                console.log("[BOT KICKED]", key);

                socket.close();
                delete ACTIVE[key];
                return;
            }

            // ✅ CONFIRMED JOIN
            if (msg.type === "you_joined" && !joined) {

                joined = true;

                console.log("[BOT JOINED]", key);

              ///  global.CHILD_CONNECTED = global.CHILD_CONNECTED || {};
               /// global.CHILD_CONNECTED[config.room] = {
               ///     room: config.room,
               ///     username: config.username
              ///  };

                send(socket, {
                    handler: "room_message",
                    type: "text",
                    room: config.room,
                    body: "🤖 Bot ready",
                    id: packet()
                });

                return Promise.resolve({
                    success: true,
                    socket
                });
            }

            handleRoom(socket, config, msg);
        }

    });

    socket.on("close", () => {

        console.log("[BOT CLOSED]", key);

        delete ACTIVE[key];
        delete (global.CHILD_CONNECTED || {})[config.room];

    });

    socket.on("error", (e) => {
        console.log("[BOT ERROR]", e.message);
    });

    // KEEP ALIVE
    setInterval(() => {
        send(socket, { handler: "ping", id: packet() });
    }, 20000);

    return Promise.resolve({ success: true, socket });
}

// ================= ROOM =================
function handleRoom(socket, config, msg) {

    if (!msg.body) return;

    const body = msg.body.toLowerCase().trim();
    const from = msg.from;

    const isMaster =
        from === config.owner ||
        (config.roomMasters || []).includes(from);

    if (body === "@quiz on" && isMaster) {
        config.quiz = true;
        QuizSystem.startQuiz(socket, config.room);
    }

    if (body === "@quiz off" && isMaster) {
        config.quiz = false;
        QuizSystem.stopQuiz(config.room);
    }

    if (config.quiz) {
        QuizSystem.handleAnswer(socket, config.room, from, body);
    }
}

module.exports = { start };
