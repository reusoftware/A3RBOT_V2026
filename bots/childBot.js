const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function packet() {
    return "BOT-" + Date.now();
}

function send(socket, payload) {
    if (!socket || socket.readyState !== 1) return;
    socket.send(JSON.stringify(payload));
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

function start(config) {

    return new Promise((resolve) => {

        if (!config.roomMasters) config.roomMasters = [];
        if (config.welcome === undefined) config.welcome = true;
        if (config.quiz === undefined) config.quiz = false;

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let joined = false;

        console.log("[CHILDBOT START]", config.username);

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

            // ================= LOGIN =================
            if (msg.handler === "login_event" && msg.type === "success") {

                send(socket, {
                    handler: "room_join",
                    name: config.room,
                    id: packet()
                });
            }

            if (msg.handler === "login_event" && msg.type === "failed") {
                console.log("[LOGIN FAILED]", config.username);
                resolve({ success: false });
            }

            // ================= ROOM EVENTS =================
            if (msg.handler === "room_event") {

                const type = msg.type;

                // ONLY ONCE JOINED
                if (type === "you_joined" && !joined) {

                    joined = true;

                    console.log("[JOINED ROOM]", config.room);

                    sendRoom(socket, config.room,
                        "Im a Bot and ready to work!"
                    );

                    global.CHILD_CONNECTED = global.CHILD_CONNECTED || {};
                    global.CHILD_CONNECTED[config.room] = {
                        room: config.room,
                        username: config.username
                    };

                    resolve({ success: true, socket });
                    return;
                }

                handleRoom(socket, config, msg);
            }
        });

        socket.on("close", () => {
            console.log("[BOT CLOSED]", config.username);
        });

        socket.on("error", (e) => {
            console.log("[BOT ERROR]", e.message);
        });

        // KEEP ALIVE
        setInterval(() => {
            send(socket, {
                handler: "ping",
                id: packet()
            });
        }, 20000);

    });
}

// ================= ROOM HANDLER =================
function handleRoom(socket, config, msg) {

    if (msg.type !== "text") return;
    if (!msg.body) return;

    const body = msg.body.toLowerCase().trim();
    const from = msg.from;

    QuizSystem.handleAnswer(socket, config.room, from, body);

    const isMaster =
        from === config.owner ||
        config.roomMasters.includes(from);

    // HELP
    if (body === "help") {
        return sendRoom(socket, config.room,
`help
myscore
@quiz on/off
@welcome on/off
@addmaster user
@removemaster user`);
    }

    // MYSCORE
    if (body === "myscore") {
        const scores = loadJSON("./storage/scores.json", {});
        const u = scores[from];

        return sendRoom(socket, config.room,
            u ? `${from} score: ${u.score}` : "No score"
        );
    }

    // QUIZ ON
    if (body === "@quiz on" && isMaster) {
        config.quiz = true;
        saveConfig(config);

        QuizSystem.startQuiz(socket, config.room);

        return sendRoom(socket, config.room, "Quiz enabled");
    }

    // QUIZ OFF
    if (body === "@quiz off" && isMaster) {
        config.quiz = false;
        saveConfig(config);

        QuizSystem.stopQuiz(config.room);

        return sendRoom(socket, config.room, "Quiz disabled");
    }

    // WELCOME
    if (body === "@welcome on" && isMaster) {
        config.welcome = true;
        saveConfig(config);
    }

    if (body === "@welcome off" && isMaster) {
        config.welcome = false;
        saveConfig(config);
    }

    // ADD MASTER
    if (body.startsWith("@addmaster ") && isMaster) {
        const u = body.replace("@addmaster ", "").trim();

        if (!config.roomMasters.includes(u)) {
            config.roomMasters.push(u);
            saveConfig(config);
        }
    }

    // REMOVE MASTER
    if (body.startsWith("@removemaster ") && isMaster) {
        const u = body.replace("@removemaster ", "").trim();

        config.roomMasters = config.roomMasters.filter(x => x !== u);
        saveConfig(config);
    }
}

function saveConfig(config) {
    let bots = loadJSON("./storage/bots.json", []);
    const i = bots.findIndex(x => x.room === config.room);
    if (i !== -1) {
        bots[i] = config;
        saveJSON("./storage/bots.json", bots);
    }
}

module.exports = { start };
