const WebSocket = require("ws");

const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

function generatePacketID() {
    return "BOT-" + Date.now();
}

function start(config) {

    const socket = new WebSocket(
        "wss://chatp.net:5333/server"
    );

    socket.on("open", () => {

        console.log(
            `${config.username} connected`
        );

        socket.send(JSON.stringify({
            handler: "login",
            username: config.username,
            password: config.password,
            id: generatePacketID()
        }));

    });

    socket.on("message", async(data) => {

        try {

            const msg = JSON.parse(data);

            if (
                msg.handler === "login_event" &&
                msg.type === "success"
            ) {

                socket.send(JSON.stringify({
                    handler: "room_join",
                    name: config.room,
                    id: generatePacketID()
                }));

                QuizSystem.startQuiz(
                    socket,
                    config.room
                );

            }

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

            console.log(err);

        }

    });

}

async function handleRoomEvent(
    socket,
    config,
    msg
) {

    const type = msg.type;

    if (type === "user_joined") {

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

            if (
                scores[from]
            ) {

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

module.exports = {
    start
};
