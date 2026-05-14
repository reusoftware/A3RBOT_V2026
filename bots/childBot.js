const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

// ======================================
// START BOT
// ======================================

function start(config) {

    // DEFAULT SETTINGS
    if (!config.roomMasters)
        config.roomMasters = [];

    if (config.welcome === undefined)
        config.welcome = true;

    if (config.quiz === undefined)
        config.quiz = true;

    const socket = new WebSocket(
        "wss://chatp.net:5333/server"
    );

    console.log(
        "[CHILDBOT STARTING]",
        config.username
    );

    // =========================
    // CONNECT
    // =========================

    socket.on("open", () => {

        console.log(
            `[CONNECTED] ${config.username}`
        );

        socket.send(JSON.stringify({
            handler: "login",
            username: config.username,
            password: config.password,
            id: generatePacketID()
        }));

    });

    // =========================
    // RECEIVE MESSAGE
    // =========================

    socket.on("message", async(data) => {

        try {

            const msg = JSON.parse(data);

            console.log(
                "[RAW CHILDBOT]",
                msg
            );

            // =====================
            // LOGIN SUCCESS
            // =====================

            if (
                msg.handler === "login_event" &&
                msg.type === "success"
            ) {

                console.log(
                    `[LOGIN SUCCESS] ${config.username}`
                );

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: generatePacketID()
                }));

                console.log(
                    `[JOINING ROOM] ${config.room}`
                );

                // START QUIZ
                if (config.quiz) {

                    QuizSystem.startQuiz(
                        socket,
                        config.room
                    );

                }

            }

            // =====================
            // LOGIN FAILED
            // =====================

            if (
                msg.handler === "login_event" &&
                (
                    msg.type === "failed" ||
                    msg.type === "error"
                )
            ) {

                console.log(
                    `[LOGIN FAILED] ${config.username}`
                );

            }

            // =====================
            // ROOM EVENT
            // =====================

            if (
                msg.handler === "room_event"
            ) {

                await handleRoomEvent(
                    socket,
                    config,
                    msg
                );

            }

        } catch(err) {

            console.log(
                "[CHILDBOT ERROR]",
                err
            );

        }

    });

    // =========================
    // ERROR
    // =========================

    socket.on("error", (err) => {

        console.log(
            "[SOCKET ERROR]",
            err
        );

    });

    // =========================
    // CLOSE
    // =========================

    socket.on("close", () => {

        console.log(
            `[CLOSED] ${config.username}`
        );

    });

}

// ======================================
// ROOM EVENTS
// ======================================

async function handleRoomEvent(
    socket,
    config,
    msg
) {

    const type = msg.type;

    // ==================================
    // USER JOINED
    // ==================================

    if (
        type === "user_joined"
    ) {

        if (config.welcome === false)
            return;

        const welcomes = [

            `Welcome ${msg.username}`,

            `Hello ${msg.username}`,

            `Enjoy your stay ${msg.username}`,

            `Nice to see you ${msg.username}`

        ];

        const random = welcomes[
            Math.floor(
                Math.random() * welcomes.length
            )
        ];

        sendRoomMessage(
            socket,
            config.room,
            random
        );

    }

    // ==================================
    // ROOM TEXT
    // ==================================

    if (
        type === "text" ||
        type === "message" ||
        type === "chat"
    ) {

        if (!msg.body) return;

        const body =
            msg.body.toLowerCase().trim();

        const from = msg.from;

        console.log(
            `[ROOM MESSAGE] ${from}: ${body}`
        );
// ==============================
// MASTER LIST
// ==============================

if (body === "maslist") {

    const isMainMaster = from === config.owner;
    const isRoomMaster = config.roomMasters.includes(from);

    if (!isMainMaster && !isRoomMaster) {
        return sendRoomMessage(
            socket,
            config.room,
            "Only masters can view master list."
        );
    }

    if (!config.roomMasters || config.roomMasters.length === 0) {
        return sendRoomMessage(
            socket,
            config.room,
            "No room masters yet."
        );
    }

    let list = config.roomMasters
        .map((m, i) => `${i + 1}. ${m}`)
        .join("\n");

    sendRoomMessage(
        socket,
        config.room,
        `📋 ROOM MASTERS:\n\n${list}`
    );
}
        // ==========================
        // HELP
        // ==========================

        if (body === "help") {

            sendRoomMessage(
                socket,
                config.room,

`BOT COMMANDS

help
myscore

@welcome on
@welcome off

@quiz on
@quiz off

@addmaster username
@removemaster username`
            );

        }

        // ==========================
        // CHECK MASTER
        // ==========================

        const isMainMaster =
            from === config.owner;

        const isRoomMaster =
            config.roomMasters.includes(from);

        const isMaster =
            isMainMaster || isRoomMaster;

        // ==========================
        // ADD ROOM MASTER
        // ==========================

        if (
            body.startsWith("@addmaster ")
        ) {

            if (!isMaster) {

                return sendRoomMessage(
                    socket,
                    config.room,
                    "Only masters can add master."
                );

            }

            const target =
                body.replace(
                    "@addmaster ",
                    ""
                ).trim();

            if (
                !config.roomMasters.includes(target)
            ) {

                config.roomMasters.push(target);

                saveBotConfig(config);

                sendRoomMessage(
                    socket,
                    config.room,
                    `${target} added as room master.`
                );

            }

        }

   // ==============================
// REMOVE MASTER BY NUMBER
// ==============================

if (body.startsWith("@removemaster ")) {

    const isMainMaster = from === config.owner;
    const isRoomMaster = config.roomMasters.includes(from);

    if (!isMainMaster && !isRoomMaster) {
        return sendRoomMessage(
            socket,
            config.room,
            "Only masters can remove master."
        );
    }

    const indexStr = body.replace("@removemaster ", "").trim();
    const index = parseInt(indexStr) - 1;

    if (isNaN(index)) {
        return sendRoomMessage(
            socket,
            config.room,
            "Use number from maslist.\nExample: @removemaster 1"
        );
    }

    if (
        index < 0 ||
        index >= config.roomMasters.length
    ) {
        return sendRoomMessage(
            socket,
            config.room,
            "Invalid master number."
        );
    }

    const removed = config.roomMasters[index];

    if (removed === config.owner) {
        return sendRoomMessage(
            socket,
            config.room,
            "Cannot remove main master."
        );
    }

    config.roomMasters.splice(index, 1);

    saveBotConfig(config);

    sendRoomMessage(
        socket,
        config.room,
        `❌ Removed master: ${removed}`
    );
}

        // ==========================
        // WELCOME ON
        // ==========================

        if (body === "@welcome on") {

            if (!isMaster)
                return;

            config.welcome = true;

            saveBotConfig(config);

            sendRoomMessage(
                socket,
                config.room,
                "Welcome enabled."
            );

        }

        // ==========================
        // WELCOME OFF
        // ==========================

        if (body === "@welcome off") {

            if (!isMaster)
                return;

            config.welcome = false;

            saveBotConfig(config);

            sendRoomMessage(
                socket,
                config.room,
                "Welcome disabled."
            );

        }

        // ==========================
        // QUIZ ON
        // ==========================

        if (body === "@quiz on") {

            if (!isMaster)
                return;

            config.quiz = true;

            saveBotConfig(config);

            QuizSystem.startQuiz(
                socket,
                config.room
            );

            sendRoomMessage(
                socket,
                config.room,
                "Quiz enabled."
            );

        }

        // ==========================
        // QUIZ OFF
        // ==========================

        if (body === "@quiz off") {

            if (!isMaster)
                return;

            config.quiz = false;

            saveBotConfig(config);

            sendRoomMessage(
                socket,
                config.room,
                "Quiz disabled."
            );

        }

        // ==========================
        // HANDLE ANSWER
        // ==========================

        if (config.quiz !== false) {

            QuizSystem.handleAnswer(
                socket,
                config.room,
                from,
                body
            );

        }

        // ==========================
        // MYSCORE
        // ==========================

        if (body === "myscore") {

            const scores = loadJSON(
                "./storage/scores.json",
                {}
            );

            if (scores[from]) {

                const user =
                    scores[from];

                sendRoomMessage(
                    socket,
                    config.room,

`${from}

Score: ${user.score}

Best Speed:
${user.bestTime || 0}s`
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

// ======================================
// SAVE BOT CONFIG
// ======================================

function saveBotConfig(config) {

    let bots = loadJSON(
        "./storage/bots.json",
        []
    );

    const index = bots.findIndex(
        x => x.room === config.room
    );

    if (index !== -1) {

        bots[index] = config;

        saveJSON(
            "./storage/bots.json",
            bots
        );

    }

}

// ======================================
// SEND ROOM MESSAGE
// ======================================

function sendRoomMessage(
    socket,
    room,
    body
) {

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

// ======================================

module.exports = {
    start
};
