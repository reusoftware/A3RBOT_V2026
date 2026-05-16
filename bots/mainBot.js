const WebSocket = require("ws");
const ChildBot = require("./childBot");

const {
    loadJSON,
    saveJSON
} = require("./storage");

let BOT_USERNAME = "";
let BOT_PASSWORD = "";

let socket;

function generatePacketID() {
    return "BOT-" + Date.now();
}

async function start(username, password) {

    socket = new WebSocket(
        "wss://chatp.net:5333/server"
    );

    socket.on("open", () => {

        console.log("Main Bot Connected");

        socket.send(JSON.stringify({
            handler: "login",
            username: username,
            password: password,
            id: generatePacketID()
        }));

    });

    socket.on("message", async(data) => {

        try {

            const msg = JSON.parse(data);

            if (
                msg.handler === "chat_message"
            ) {

                await handlePrivateMessage(msg);

            }

        } catch(err) {

            console.log(err);

        }

    });

    loadSavedBots();

}

async function handlePrivateMessage(msg) {

    if (!msg.body) return;

    const from = msg.from;
    const body = msg.body.trim();

    if (body === "help") {

        sendPrivate(
            from,
`SERVER FUN BOT GUIDE

Request ChildBot:
j/room#username#password

Example:
j/MyRoom#child1#pass123

Commands:
@welcome on
@welcome off
@quiz on
@quiz off
myscore
@gtop`
        );

    }

    if (body.startsWith("j/")) {

        await createChildBot(
            from,
            body
        );

    }

}

async function createChildBot(owner, command) {

    try {

        const data = command
            .substring(2)
            .split("#");

        const room = data[0];
        const username = data[1];
        const password = data[2];

        if (
            !room ||
            !username ||
            !password
        ) {

            sendPrivate(
                owner,
                "Invalid format."
            );

            return;

        }

        let bots = loadJSON(
            "./storage/bots.json"
        );

        const exists = bots.find(
            x => x.room === room
        );

        if (exists) {

            sendPrivate(
                owner,
                "Room already has bot."
            );

            return;

        }

        const botConfig = {
            room,
            username,
            password,
            owner,
            welcome: true,
            quiz: true
        };

        bots.push(botConfig);

        saveJSON(
            "./storage/bots.json",
            bots
        );

        ChildBot.start(botConfig);

        sendPrivate(
            owner,
            `ChildBot created for ${room}`
        );

    } catch(err) {

        console.log(err);

    }

}

function loadSavedBots() {

    const bots = loadJSON(
        "./storage/bots.json"
    );

    bots.forEach(bot => {

        ChildBot.start(bot);

    });

}

function sendPrivate(to, body) {

    socket.send(JSON.stringify({
        handler: "chat_message",
        type: "text",
        to,
        body,
        url: "",
        length: "0",
        id: generatePacketID()
    }));

}

module.exports = {
    start
};
