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

    return new Promise((resolve) => {

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let resolved = false;

        console.log(
            "[CHILDBOT STARTING]",
            config.username
        );

        // ======================================
        // CONNECT
        // ======================================

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

        // ======================================
        // MESSAGE
        // ======================================

        socket.on("message", async(data) => {

            try {

                const text = data.toString();

                console.log(
                    "[RAW BOT]",
                    text
                );

                let msg;

                try {

                    msg = JSON.parse(text);

                } catch {

                    return;

                }

                // ======================================
                // LOGIN SUCCESS
                // ======================================

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
                        `[JOIN ROOM] ${config.room}`
                    );

                    if (!resolved) {

                        resolved = true;

                        resolve({
                            success: true
                        });

                    }

                    // START QUIZ
                    if (config.quiz !== false) {

                        QuizSystem.startQuiz(
                            socket,
                            config.room
                        );

                    }

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
                        `[LOGIN FAILED] ${config.username}`
                    );

                    if (!resolved) {

                        resolved = true;

                        resolve({
                            success: false
                        });

                    }

                    socket.close();

                }

                // ======================================
                // ROOM EVENT
                // ======================================

                if (
                    msg.handler === "room_event" ||
                    msg.handler === "room_message"
                ) {

                    await handleRoomEvent(
                        socket,
                        config,
                        msg
                    );

                }

            } catch(err) {

                console.log(
                    "[BOT ERROR]",
                    err
                );

            }

        });

        // ======================================
        // ERROR
        // ======================================

        socket.on("error", (err) => {

            console.log(
                "[SOCKET ERROR]",
                err
            );

        });

        // ======================================
        // CLOSE
        // ======================================

        socket.on("close", () => {

            console.log(
                `[CLOSED] ${config.username}`
            );

        });

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

    console.log(
        "[ROOM EVENT]",
        msg
    );

    const type = msg.type || "";

    // ======================================
    // USER JOINED
    // ======================================

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

    // ======================================
    // ROOM MESSAGE
    // ======================================

    if (msg.body) {

        const body =
            msg.body.toLowerCase().trim();

        const from =
            msg.from || msg.username || "unknown";

        console.log(
            `[ROOM MSG] ${from}: ${body}`
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
@welcome on
@welcome off
@quiz on
@quiz off
@addmaster username
@delmaster number
maslist
myscore`
            );

        }

        // ======================================
        // MASTER SYSTEM
        // ======================================

        if (!config.masters) {
            config.masters = [];
        }

        // owner always master
        if (
            config.owner &&
            !config.masters.includes(config.owner)
        ) {

            config.masters.push(config.owner);

        }

        const isMaster =
            config.masters.includes(from);

        // ======================================
        // MASTER LIST
        // ======================================

        if (body === "maslist") {

            let text = "ROOM MASTERS\n\n";

            config.masters.forEach((x, i) => {

                text += `${i + 1}. ${x}\n`;

            });

            return sendRoomMessage(
                socket,
                config.room,
                text
            );

        }

        // ======================================
        // ADD MASTER
        // ======================================

        if (
            body.startsWith("@addmaster ")
        ) {

            if (!isMaster) {
                return;
            }

            const target =
                body.replace(
                    "@addmaster ",
                    ""
                ).trim();

            if (
                !config.masters.includes(target)
            ) {

                config.masters.push(target);

                sendRoomMessage(
                    socket,
                    config.room,
                    `${target} added as master`
                );

            }

        }

        // ======================================
        // REMOVE MASTER
        // ======================================

        if (
            body.startsWith("@delmaster ")
        ) {

            if (!isMaster) {
                return;
            }

            const number = parseInt(
                body.replace(
                    "@delmaster ",
                    ""
                )
            );

            if (isNaN(number)) {
                return;
            }

            const index = number - 1;

            if (
                !config.masters[index]
            ) {
                return;
            }

            const target =
                config.masters[index];

            // cannot remove owner
            if (
                target === config.owner
            ) {

                return sendRoomMessage(
                    socket,
                    config.room,
                    "Cannot remove main master"
                );

            }

            config.masters.splice(index, 1);

            sendRoomMessage(
                socket,
                config.room,
                `${target} removed`
            );

        }

        // ======================================
        // WELCOME ON
        // ======================================

        if (
            body === "@welcome on"
        ) {

            if (!isMaster) return;

            config.welcome = true;

            return sendRoomMessage(
                socket,
                config.room,
                "Welcome enabled"
            );

        }

        // ======================================
        // WELCOME OFF
        // ======================================

        if (
            body === "@welcome off"
        ) {

            if (!isMaster) return;

            config.welcome = false;

            return sendRoomMessage(
                socket,
                config.room,
                "Welcome disabled"
            );

        }

        // ======================================
        // QUIZ ON
        // ======================================

        if (
            body === "@quiz on"
        ) {

            if (!isMaster) return;

            config.quiz = true;

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

        // ======================================
        // QUIZ OFF
        // ======================================

        if (
            body === "@quiz off"
        ) {

            if (!isMaster) return;

            config.quiz = false;

            return sendRoomMessage(
                socket,
                config.room,
                "Quiz disabled"
            );

        }

        // ======================================
        // HANDLE ANSWER
        // ======================================

        if (
            config.quiz !== false
        ) {

            QuizSystem.handleAnswer(
                socket,
                config.room,
                from,
                body
            );

        }

        // ======================================
        // MYSCORE
        // ======================================

        if (body === "myscore") {

            const scores = loadJSON(
                "./storage/scores.json",
                {}
            );

            if (scores[from]) {

                return sendRoomMessage(
                    socket,
                    config.room,

`${from}

Score: ${scores[from].score || 0}
Correct: ${scores[from].correct || 0}
Best Time: ${scores[from].bestTime || 0}s`
                );

            }

            return sendRoomMessage(
                socket,
                config.room,
                `${from} has no score yet`
            );

        }

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
