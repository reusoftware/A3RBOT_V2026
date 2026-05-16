const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

function packet() {

    return (
        "BOT-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 9999)
    );

}

// =====================================
// SEND ROOM MESSAGE
// =====================================

function sendRoomMessage(
    socket,
    room,
    body
) {

    try {

        if (!socket) return;

        if (socket.readyState !== 1)
            return;

        const payload = {

            handler: "room_message",

            type: "text",

            id: packet(),

            body: body,

            room: room,

            url: "",

            length: "0"

        };

        socket.send(JSON.stringify(payload));

        console.log(
            "[BOT SEND]",
            body
        );

    } catch(err) {

        console.log(
            "[SEND ERROR]",
            err.message
        );

    }

}

// =====================================
// SAVE CONFIG
// =====================================

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

// =====================================
// START BOT
// =====================================

function start(config) {

    return new Promise((resolve) => {

        if (!config.roomMasters)
            config.roomMasters = [];

        if (config.welcome === undefined)
            config.welcome = true;

        if (config.quiz === undefined)
            config.quiz = true;

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let resolved = false;
        let joinedRoom = false;

        console.log(
            "[BOT STARTING]",
            config.username
        );

        // =================================
        // CONNECT
        // =================================

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

        // =================================
        // RECEIVE
        // =================================

        socket.on("message", async(data) => {

            let msg;

            try {

                msg = JSON.parse(
                    data.toString()
                );

            } catch {

                return;

            }

            console.log(
                "[BOT RAW]",
                msg
            );

            // ============================
            // LOGIN SUCCESS
            // ============================

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

                console.log(
                    "[JOIN ROOM]",
                    config.room
                );

            }

            // ============================
            // LOGIN FAILED
            // ============================

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

                if (!resolved) {

                    resolved = true;

                    resolve({
                        success: false
                    });

                }

            }

            // ============================
            // ROOM JOINED
            // ============================

            if (
                msg.handler === "room_event" &&
                (
                    msg.type === "you_joined" ||
                    msg.type === "joined"
                )
            ) {

                if (joinedRoom)
                    return;

                joinedRoom = true;

                console.log(
                    "[ROOM JOINED]",
                    config.room
                );

                // VERY IMPORTANT
                // WAIT BEFORE TALKING

                setTimeout(() => {

                    sendRoomMessage(
                        socket,
                        config.room,
                        "Im a Bot and ready to work!"
                    );

                },20000);

                // START QUIZ AFTER ROOM STABLE

                if (config.quiz) {

                    setTimeout(() => {

                        QuizSystem.startQuiz(
                            socket,
                            config.room
                        );

                    }, 15000);

                }

                if (!resolved) {

                    resolved = true;

                    resolve({
                        success: true,
                        socket
                    });

                }

            }

            // ============================
            // ROOM EVENTS
            // ============================

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

        // =================================
        // CLOSE
        // =================================

        socket.on("close", () => {

            console.log(
                "[BOT CLOSED]",
                config.username
            );

        });

        // =================================
        // ERROR
        // =================================

        socket.on("error", (err) => {

            console.log(
                "[BOT ERROR]",
                err.message
            );

        });

        // =================================
        // KEEP ALIVE
        // =================================

        setInterval(() => {

            try {

                if (
                    socket.readyState === 1
                ) {

                    socket.send(JSON.stringify({

                        handler: "ping",

                        id: packet()

                    }));

                }

            } catch {}

        }, 20000);

    });

}

// =====================================
// ROOM EVENTS
// =====================================

async function handleRoomEvent(
    socket,
    config,
    msg
) {

    const type = msg.type;

    // ==========================
    // USER JOINED
    // ==========================

    if (type === "user_joined") {

        if (!config.welcome)
            return;

        const username =
            msg.username ||
            msg.from ||
            "User";

        sendRoomMessage(
            socket,
            config.room,
            `Welcome ${username}`
        );

    }

    // ==========================
    // ROOM MESSAGE
    // ==========================

    if (
        type !== "text" &&
        type !== "message" &&
        type !== "chat"
    ) return;

    if (!msg.body)
        return;

    const body =
        msg.body.toLowerCase().trim();

    const from =
        msg.from || "";

    const isMainMaster =
        from === config.owner;

    const isRoomMaster =
        config.roomMasters.includes(from);

    const isMaster =
        isMainMaster || isRoomMaster;

    // ==========================
    // HELP
    // ==========================

    if (body === "help") {

        return sendRoomMessage(
            socket,
            config.room,

`BOT COMMANDS

help
myscore
masters

@quiz on
@quiz off

@welcome on
@welcome off

@addmaster username
@removemaster username`
        );

    }

    // ==========================
    // MASTER LIST
    // ==========================

    if (body === "masters") {

        return sendRoomMessage(
            socket,
            config.room,
            config.roomMasters.length
            ? config.roomMasters.join(", ")
            : "No room masters"
        );

    }

    // ==========================
    // ADD MASTER
    // ==========================

    if (
        body.startsWith("@addmaster ")
    ) {

        if (!isMaster)
            return;

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

        }

        return sendRoomMessage(
            socket,
            config.room,
            `${target} added as master`
        );

    }

    // ==========================
    // REMOVE MASTER
    // ==========================

    if (
        body.startsWith("@removemaster ")
    ) {

        if (!isMaster)
            return;

        const target =
            body.replace(
                "@removemaster ",
                ""
            ).trim();

        config.roomMasters =
            config.roomMasters.filter(
                x => x !== target
            );

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            `${target} removed`
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

        return sendRoomMessage(
            socket,
            config.room,
            "Quiz enabled"
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

        QuizSystem.stopQuiz(
            config.room
        );

        return sendRoomMessage(
            socket,
            config.room,
            "Quiz disabled"
        );

    }

    // ==========================
    // ANSWERS
    // ==========================

    if (config.quiz) {

        QuizSystem.handleAnswer(
            socket,
            config.room,
            from,
            body
        );

    }

}

module.exports = {
    start
};
