const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

function packet() {
    return "BOT-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

// ======================================

function start(config) {

    return new Promise((resolve) => {

        if (!config.roomMasters)
            config.roomMasters = [];

        if (config.welcome === undefined)
            config.welcome = true;

        if (config.quiz === undefined)
            config.quiz = false;

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let roomReady = false;

        console.log(
            "[BOT START]",
            config.username
        );

        // ======================================
        // OPEN
        // ======================================

        socket.on("open", () => {

            console.log(
                "[BOT CONNECTED]",
                config.username
            );

            socket.send(JSON.stringify({

                handler: "login",

                username: config.username,

                password: config.password,

                id: packet()

            }));

        });

        // ======================================
        // MESSAGE
        // ======================================

        socket.on("message", async(data) => {

            try {

                const msg = JSON.parse(
                    data.toString()
                );

                // ======================================
                // LOGIN SUCCESS
                // ======================================

                if (
                    msg.handler === "login_event" &&
                    msg.type === "success"
                ) {

                    console.log(
                        "[LOGIN SUCCESS]",
                        config.username
                    );

                    socket.send(JSON.stringify({

                        handler: "room_join",

                        name: config.room,

                        id: packet()

                    }));

                    return;
                }

                // ======================================
                // LOGIN FAILED
                // ======================================

                if (
                    msg.handler === "login_event" &&
                    (
                        msg.type === "failed" ||
                        msg.type === "error"
                    )
                ) {

                    console.log(
                        "[LOGIN FAILED]",
                        config.username
                    );

                    return resolve({
                        success: false
                    });

                }

                // ======================================
                // ROOM READY
                // ======================================

                if (
                    msg.handler === "room_event" &&
                    msg.type === "you_joined"
                ) {

                    if (roomReady)
                        return;

                    roomReady = true;

                    console.log(
                        "[ROOM READY]",
                        config.room
                    );

                    sendRoomMessage(
                        socket,
                        config.room,
                        "🤖 Im a Bot and ready to work!"
                    );

                    // QUIZ DELAYED
                    if (config.quiz) {

                        setTimeout(() => {

                            QuizSystem.startQuiz(
                                socket,
                                config.room
                            );

                        }, 5000);

                    }

                    resolve({
                        success: true,
                        socket
                    });

                    return;
                }

                // ======================================
                // IGNORE UNTIL READY
                // ======================================

                if (!roomReady)
                    return;

                // ======================================
                // ROOM EVENTS
                // ======================================

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
                    "[BOT MESSAGE ERROR]",
                    err
                );

            }

        });

        // ======================================
        // CLOSE
        // ======================================

        socket.on("close", () => {

            console.log(
                "[BOT CLOSED]",
                config.username
            );

        });

        // ======================================
        // ERROR
        // ======================================

        socket.on("error", (err) => {

            console.log(
                "[BOT ERROR]",
                err.message
            );

        });

        // ======================================
        // KEEP ALIVE
        // ======================================

        setInterval(() => {

            if (
                socket.readyState === 1
            ) {

                socket.send(JSON.stringify({

                    handler: "ping",

                    id: packet()

                }));

            }

        }, 20000);

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

    // ======================================
    // USER JOINED
    // ======================================

    if (
        type === "user_joined"
    ) {

        if (!config.welcome)
            return;

        const text = [

            `Welcome ${msg.username}`,

            `Hello ${msg.username}`,

            `Nice to see you ${msg.username}`

        ];

        sendRoomMessage(

            socket,

            config.room,

            text[
                Math.floor(
                    Math.random() * text.length
                )
            ]

        );

        return;
    }

    // ======================================
    // TEXT MESSAGE
    // ======================================

    if (type !== "text")
        return;

    if (!msg.body)
        return;

    const body =
        msg.body
        .toLowerCase()
        .trim();

    const from = msg.from;

    console.log(
        "[ROOM]",
        from,
        body
    );

    // ======================================
    // QUIZ ANSWER
    // ======================================

    QuizSystem.handleAnswer(
        socket,
        config.room,
        from,
        body
    );

    // ======================================
    // HELP
    // ======================================

    if (body === "help") {

        return sendRoomMessage(
            socket,
            config.room,

`BOT COMMANDS

help
myscore

@quiz on
@quiz off

@welcome on
@welcome off`
        );

    }

    // ======================================
    // MASTER CHECK
    // ======================================

    const isMaster =
        from === config.owner ||
        config.roomMasters.includes(from);

    // ======================================
    // QUIZ ON
    // ======================================

    if (
        body === "@quiz on"
    ) {

        if (!isMaster)
            return;

        config.quiz = true;

        saveBotConfig(config);

        QuizSystem.startQuiz(
            socket,
            config.room
        );

        return sendRoomMessage(
            socket,
            config.room,
            "Quiz enabled."
        );

    }

    // ======================================
    // QUIZ OFF
    // ======================================

    if (
        body === "@quiz off"
    ) {

        if (!isMaster)
            return;

        config.quiz = false;

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            "Quiz disabled."
        );

    }

    // ======================================
    // WELCOME ON
    // ======================================

    if (
        body === "@welcome on"
    ) {

        if (!isMaster)
            return;

        config.welcome = true;

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            "Welcome enabled."
        );

    }

    // ======================================
    // WELCOME OFF
    // ======================================

    if (
        body === "@welcome off"
    ) {

        if (!isMaster)
            return;

        config.welcome = false;

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            "Welcome disabled."
        );

    }

    // ======================================
    // MYSCORE
    // ======================================

    if (
        body === "myscore"
    ) {

        const scores = loadJSON(
            "./storage/scores.json",
            {}
        );

        if (!scores[from]) {

            return sendRoomMessage(
                socket,
                config.room,
                "No score yet."
            );

        }

        const u = scores[from];

        return sendRoomMessage(

            socket,

            config.room,

`${from}

Score: ${u.score}

Best:
${u.best.toFixed(2)}s`

        );

    }

}

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

function sendRoomMessage(
    socket,
    room,
    body
) {

    if (
        socket.readyState !== 1
    ) return;

    socket.send(JSON.stringify({

        handler: "room_message",

        type: "text",

        room,

        body,

        id: packet()

    }));

}

// ======================================

module.exports = {
    start
};
