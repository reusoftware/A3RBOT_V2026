const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

const MainBot = require("./mainBot");

function packet() {
    return "BOT-" + Date.now();
}

function sendRoom(socket, room, body) {

    if (!socket) return;
    if (socket.readyState !== 1) return;

    socket.send(JSON.stringify({

        handler: "room_message",

        type: "text",

        room: room,

        body: body,

        id: packet()

    }));
}

function saveConfig(config) {

    let bots = loadJSON(
        "./storage/bots.json",
        []
    );

    const index =
        bots.findIndex(
            x => x.room === config.room
        );

    if (index !== -1) {

        bots[index] = config;

    } else {

        bots.push(config);

    }

    saveJSON(
        "./storage/bots.json",
        bots
    );
}

function start(config) {

    if (!config.roomMasters)
        config.roomMasters = [];

    const socket =
        new WebSocket(
            "wss://chatp.net:5333/server"
        );

    let joined = false;

    console.log(
        "[CHILDBOT START]",
        config.username
    );

    socket.on("open", () => {

        socket.send(JSON.stringify({

            handler: "login",

            username: config.username,

            password: config.password,

            id: packet()

        }));

    });

    socket.on("message", async(data) => {

        let msg;

        try {

            msg = JSON.parse(data.toString());

        } catch {

            return;

        }

        // LOGIN SUCCESS
        if (
            msg.handler === "login_event" &&
            msg.type === "success"
        ) {

            console.log(
                "[BOT LOGIN SUCCESS]",
                config.username
            );

            socket.send(JSON.stringify({

                handler: "room_join",

                name: config.room,

                id: packet()

            }));

        }

        // ROOM EVENTS
        if (msg.handler === "room_event") {

            // JOINED ROOM
            if (
                msg.type === "you_joined" &&
                !joined
            ) {

                joined = true;

                console.log(
                    "[BOT JOINED ROOM]",
                    config.room
                );

                global.ACTIVE_CHILD_BOTS[
                    config.room
                ] = {

                    room: config.room,

                    username: config.username

                };

                MainBot.updateConsole();

                saveConfig(config);

                // delayed message prevents kick
                setTimeout(() => {

                    sendRoom(
                        socket,
                        config.room,
                        "Im a Bot and ready to work!"
                    );

                }, 2000);

                // delayed quiz start
                setTimeout(() => {

                    QuizSystem.startQuiz(
                        socket,
                        config.room
                    );

                }, 5000);

            }

            handleRoomEvent(
                socket,
                config,
                msg
            );
        }

    });

    socket.on("close", () => {

        console.log(
            "[BOT CLOSED]",
            config.username
        );

        delete global.ACTIVE_CHILD_BOTS[
            config.room
        ];

        MainBot.updateConsole();

        setTimeout(() => {

            start(config);

        }, 10000);

    });

    socket.on("error", err => {

        console.log(
            "[BOT ERROR]",
            err.message
        );

    });

    // KEEP ALIVE
    setInterval(() => {

        if (socket.readyState === 1) {

            socket.send(JSON.stringify({

                handler: "ping",

                id: packet()

            }));

        }

    }, 20000);
}

function handleRoomEvent(
    socket,
    config,
    msg
) {

    const type = msg.type;

    // USER JOIN
    if (type === "user_joined") {

        const username =
            msg.username || "User";

        sendRoom(
            socket,
            config.room,
            `Welcome ${username}`
        );
    }

    // ROOM TEXT
    if (type !== "text") return;

    if (!msg.body) return;

    const body =
        msg.body.toLowerCase().trim();

    const from = msg.from;

    const isMaster =
        from === config.owner ||
        config.roomMasters.includes(from);

    // ADD MASTER
    if (
        body.startsWith("@addmaster ")
    ) {

        if (!isMaster) return;

        const user =
            body.replace(
                "@addmaster ",
                ""
            ).trim();

        if (
            !config.roomMasters.includes(user)
        ) {

            config.roomMasters.push(user);

            saveConfig(config);

            sendRoom(
                socket,
                config.room,
                `${user} added as master`
            );
        }
    }

    // REMOVE MASTER
    if (
        body.startsWith("@removemaster ")
    ) {

        if (!isMaster) return;

        const user =
            body.replace(
                "@removemaster ",
                ""
            ).trim();

        config.roomMasters =
            config.roomMasters.filter(
                x => x !== user
            );

        saveConfig(config);

        sendRoom(
            socket,
            config.room,
            `${user} removed`
        );
    }

    // MASTER LIST
    if (body === "@masters") {

        return sendRoom(
            socket,
            config.room,

            config.roomMasters.length === 0
                ? "No masters"
                : config.roomMasters.join(", ")
        );
    }

    // MY SCORE
    if (body === "myscore") {

        const scores =
            loadJSON(
                "./storage/scores.json",
                {}
            );

        if (!scores[from]) {

            return sendRoom(
                socket,
                config.room,
                "No score yet."
            );
        }

        const s = scores[from];

        return sendRoom(
            socket,
            config.room,

`${from}
Score: ${s.score}`
        );
    }

    // TOP
    if (body === "@top") {

        const scores =
            loadJSON(
                "./storage/scores.json",
                {}
            );

        const top =
            Object.entries(scores)

            .sort(
                (a, b) =>
                b[1].score - a[1].score
            )

            .slice(0, 10);

        if (top.length === 0) {

            return sendRoom(
                socket,
                config.room,
                "No scores yet."
            );
        }

        let text =
            "GLOBAL TOP PLAYERS\n\n";

        top.forEach((x, i) => {

            text +=
                `${i+1}. ${x[0]} = ${x[1].score}\n`;

        });

        sendRoom(
            socket,
            config.room,
            text
        );
    }

    // QUIZ ANSWER
    QuizSystem.handleAnswer(
        socket,
        config.room,
        from,
        body
    );
}

module.exports = {
    start
};
