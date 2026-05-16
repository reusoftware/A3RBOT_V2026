const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function packet() {
    return "BOT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function sendRoomMessage(socket, room, body) {

    try {

        if (socket.readyState !== 1) return;

        socket.send(JSON.stringify({
            handler: "room_message",
            type: "text",
            room,
            body,
            id: packet()
        }));

    } catch (err) {
        console.log("[ROOM SEND ERROR]", err.message);
    }
}

function saveBotConfig(config) {

    let bots = loadJSON("./storage/bots.json", []);

    const index = bots.findIndex(x => x.room === config.room);

    if (index !== -1) {

        bots[index] = config;

        saveJSON("./storage/bots.json", bots);
    }
}

function start(config) {

    return new Promise((resolve) => {

        if (!config.roomMasters)
            config.roomMasters = [];

        if (config.welcome === undefined)
            config.welcome = true;

        if (config.quiz === undefined)
            config.quiz = false;

        const socket = new WebSocket("wss://chatp.net:5333/server");

        let joined = false;
        let reconnecting = false;

        console.log("[BOT START]", config.username);

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

            if (msg.handler === "login_event") {

                if (msg.type === "success") {

                    console.log("[LOGIN SUCCESS]", config.username);

                    socket.send(JSON.stringify({
                        handler: "room_join",
                        name: config.room,
                        id: packet()
                    }));
                }

                if (msg.type === "failed") {

                    console.log("[LOGIN FAILED]", config.username);

                    return resolve({ success: false });
                }
            }

            if (msg.handler === "room_event") {

                if (msg.type === "you_joined" && !joined) {

                    joined = true;

                    console.log("[ROOM JOINED]", config.room);

                    sendRoomMessage(
                        socket,
                        config.room,
                        "Im a Bot and ready to work!"
                    );

                    resolve({
                        success: true,
                        socket
                    });
                }

                await handleRoomEvent(socket, config, msg);
            }
        });

        socket.on("close", () => {

            console.log("[BOT CLOSED]", config.username);

            if (reconnecting) return;

            reconnecting = true;

            setTimeout(() => {
                start(config);
            }, 10000);
        });

        socket.on("error", (err) => {
            console.log("[BOT ERROR]", err.message);
        });

        setInterval(() => {

            try {

                if (socket.readyState === 1) {

                    socket.send(JSON.stringify({
                        handler: "ping",
                        id: packet()
                    }));
                }

            } catch {}

        }, 25000);

    });
}

async function handleRoomEvent(socket, config, msg) {

    const type = msg.type;

    if (type === "user_joined") {

        if (config.welcome === false) return;

        const username = msg.username || msg.from || "User";

        const welcomes = [
            `Welcome ${username}`,
            `Hello ${username}`,
            `Nice to see you ${username}`,
            `Enjoy your stay ${username}`
        ];

        sendRoomMessage(
            socket,
            config.room,
            welcomes[Math.floor(Math.random() * welcomes.length)]
        );
    }

    if (
        type !== "text" &&
        type !== "message" &&
        type !== "chat"
    ) return;

    if (!msg.body) return;

    const body = msg.body.toLowerCase().trim();
    const from = msg.from;

    console.log(`[ROOM] ${from}: ${body}`);

    const isMainMaster = from === config.owner;
    const isRoomMaster = config.roomMasters.includes(from);
    const isMaster = isMainMaster || isRoomMaster;

    if (body === "help") {

        return sendRoomMessage(socket, config.room,
`BOT COMMANDS

help
myscore
masters

@welcome on
@welcome off

@quiz on
@quiz off

@addmaster username
@removemaster username`
        );
    }

    if (body === "masters") {

        return sendRoomMessage(
            socket,
            config.room,
            config.roomMasters.length === 0
                ? "No room masters"
                : config.roomMasters.join(", ")
        );
    }

    if (body.startsWith("@addmaster ")) {

        if (!isMaster) return;

        const target = body.replace("@addmaster ", "").trim();

        if (!config.roomMasters.includes(target)) {

            config.roomMasters.push(target);
            saveBotConfig(config);
        }

        return sendRoomMessage(socket, config.room, `${target} added as master.`);
    }

    if (body.startsWith("@removemaster ")) {

        if (!isMaster) return;

        const target = body.replace("@removemaster ", "").trim();

        config.roomMasters = config.roomMasters.filter(x => x !== target);

        saveBotConfig(config);

        return sendRoomMessage(socket, config.room, `${target} removed.`);
    }

    if (body === "@welcome on") {

        if (!isMaster) return;

        config.welcome = true;
        saveBotConfig(config);

        return sendRoomMessage(socket, config.room, "Welcome enabled.");
    }

    if (body === "@welcome off") {

        if (!isMaster) return;

        config.welcome = false;
        saveBotConfig(config);

        return sendRoomMessage(socket, config.room, "Welcome disabled.");
    }

    if (body === "@quiz on") {

        if (!isMaster) return;

        config.quiz = true;

        saveBotConfig(config);

        QuizSystem.startQuiz(socket, config.room);

        return sendRoomMessage(socket, config.room, "Quiz enabled.");
    }

    if (body === "@quiz off") {

        if (!isMaster) return;

        config.quiz = false;

        saveBotConfig(config);

        QuizSystem.stopQuiz(config.room);

        return sendRoomMessage(socket, config.room, "Quiz disabled.");
    }

    if (config.quiz) {
        QuizSystem.handleAnswer(socket, config.room, from, body);
    }

    if (body === "myscore") {

        const scores = loadJSON("./storage/scores.json", {});

        if (!scores[from]) {
            return sendRoomMessage(socket, config.room, "No score yet.");
        }

        const user = scores[from];

        return sendRoomMessage(socket, config.room,
`${from}
Score: ${user.score}
Best: ${user.best.toFixed(2)}s`
        );
    }
}

module.exports = {
    start
};
