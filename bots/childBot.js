const WebSocket = require("ws");
const QuizSystem = require("./quizSystem");
const { loadJSON, saveJSON } = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

// ======================================
// START BOT
// ======================================

function start(config) {

    if (!config.roomMasters) config.roomMasters = [];
    if (config.welcome === undefined) config.welcome = true;
    if (config.quiz === undefined) config.quiz = true;

    const socket = new WebSocket("wss://chatp.net:5333/server");

    console.log("[CHILDBOT START]", config.username);

    socket.on("open", () => {

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
        } catch {
            return;
        }

        // ================= LOGIN SUCCESS =================
        if (msg.handler === "login_event" && msg.type === "success") {

            socket.send(JSON.stringify({
                handler: "room_join",
                name: config.room,
                id: generatePacketID()
            }));

            if (config.quiz) {
                QuizSystem.startQuiz(socket, config.room);
            }
        }

        // ================= ROOM EVENTS =================
        if (msg.handler === "room_event") {
            await handleRoomEvent(socket, config, msg);
        }
    });

    socket.on("error", err => console.log("[ERROR]", err));
    socket.on("close", () => console.log("[CLOSED]", config.username));
}

// ======================================
// ROOM EVENTS
// ======================================

async function handleRoomEvent(socket, config, msg) {

    const type = msg.type;
if (type === "you_joined") {
sendRoomMessage(socket, config.room,
                `"Im a bot Ready to Work!"`
            );
}
    // ================= USER JOIN =================
    if (type === "user_joined" && config.welcome) {

        const text = [
            `😶Welcome ${msg.username}`,
            `Hello😶 ${msg.username}`,
 `How are You ${msg.username}`,
             `😉 ${msg.username} WelcomeBack!`,
             `yes😉 you are here ${msg.username}`,
            `🙃Nice to see you ${msg.username}`
        ];

        sendRoomMessage(socket, config.room,
            text[Math.floor(Math.random() * text.length)]
        );
    }

    // ================= TEXT =================
    if (type === "text") {

        const body = msg.body?.toLowerCase().trim();
        const from = msg.from;

        if (!body) return;

        const isMainMaster = from === config.owner;
        const isRoomMaster = config.roomMasters.includes(from);
        const isMaster = isMainMaster || isRoomMaster;

        // ================= HELP =================
        if (body === "help") {

            sendRoomMessage(socket, config.room, `
BOT COMMANDS

help
myscore
maslist

+wc = welcome Activate
-wc = deactivate
+quiz = activate Quiz
-quiz = deactivate
mas+username
mas-number
            `);
        }

        // ================= MASTER LIST =================
        if (body === "maslist") {

            if (!isMaster) return;

            if (config.roomMasters.length === 0) {
                return sendRoomMessage(socket, config.room, "No room masters.");
            }

            const list = config.roomMasters
                .map((m, i) => `${i + 1}. ${m}`)
                .join("\n");

            return sendRoomMessage(socket, config.room,
                `ROOM MASTERS:\n\n${list}`
            );
        }

        // ================= ADD MASTER =================
        if (body.startsWith("mas+")) {

            if (!isMaster) return;

            const user = body.replace("mas+", "").trim();

            if (!config.roomMasters.includes(user)) {
                config.roomMasters.push(user);
                saveBot(config);
            }

            return sendRoomMessage(socket, config.room,
                `${user} added as master.`
            );
        }

        // ================= REMOVE MASTER BY NUMBER =================
        if (body.startsWith("mas-")) {

            if (!isMaster) return;

            const index = parseInt(body.replace("mas-", "")) - 1;

            if (isNaN(index) || index < 0 || index >= config.roomMasters.length) {
                return sendRoomMessage(socket, config.room, "Invalid number.");
            }

            const removed = config.roomMasters[index];

            if (removed === config.owner) {
                return sendRoomMessage(socket, config.room, "Cannot remove main master.");
            }

            config.roomMasters.splice(index, 1);
            saveBot(config);

            return sendRoomMessage(socket, config.room,
                `Removed master: ${removed}`
            );
        }

        // ================= WELCOME =================
        if (body === "+wc" && isMaster) {
            config.welcome = true;
            saveBot(config);
        }

        if (body === "-wc" && isMaster) {
            config.welcome = false;
            saveBot(config);
        }

        // ================= QUIZ =================
        if (body === "+quiz" && isMaster) {
            config.quiz = true;
            QuizSystem.startQuiz(socket, config.room);
            saveBot(config);
        }

        if (body === "-quiz" && isMaster) {
            config.quiz = false;
            saveBot(config);
        }

        // ================= ANSWER =================
        if (config.quiz !== false) {
            QuizSystem.handleAnswer(socket, config.room, from, body);
        }

        // ================= MYSCORE =================
        if (body === "myscore") {

            const scores = loadJSON("./storage/scores.json", {});

            if (!scores[from]) {
                return sendRoomMessage(socket, config.room, "No score yet.");
            }

            const u = scores[from];

            return sendRoomMessage(socket, config.room, `
${from}
Score: ${u.score}
Best Time: ${u.bestTime || 0}s
            `);
        }
    }
}

// ======================================

function sendRoomMessage(socket, room, body) {

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body,
        id: generatePacketID()
    }));
}

// ======================================

function saveBot(config) {

    let bots = loadJSON("./storage/bots.json", []);

    const index = bots.findIndex(x => x.room === config.room);

    if (index !== -1) {
        bots[index] = config;
        saveJSON("./storage/bots.json", bots);
    }
}

module.exports = { start };
