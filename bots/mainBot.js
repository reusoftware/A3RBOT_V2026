const WebSocket = require("ws");
const ChildBot = require("./childBot");

let socket;

global.ACTIVE_CHILD_BOTS = {};

function packet() {
    return "MAIN-" + Date.now();
}

function updateConsole() {

    const count =
        Object.keys(global.ACTIVE_CHILD_BOTS).length;

    console.clear();

    console.log("=================================");
    console.log(" MAIN BOT ONLINE");
    console.log(" ACTIVE CHILDBOTS:", count);
    console.log("=================================");

    Object.values(global.ACTIVE_CHILD_BOTS)
        .forEach(bot => {

            console.log(
                `[ONLINE] ${bot.username} -> ${bot.room}`
            );

        });
}

function sendPM(to, body) {

    if (!socket) return;
    if (socket.readyState !== 1) return;

    socket.send(JSON.stringify({
        handler: "chat_message",
        type: "text",
        to,
        body,
        id: packet()
    }));
}

function start(username, password) {

    socket = new WebSocket(
        "wss://chatp.net:5333/server"
    );

    socket.on("open", () => {

        console.log("[MAIN CONNECTED]");

        socket.send(JSON.stringify({
            handler: "login",
            username,
            password,
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

        // LOGIN
        if (
            msg.handler === "login_event" &&
            msg.type === "success"
        ) {

            console.log("[MAIN LOGIN SUCCESS]");
        }

        // PM COMMANDS
        if (msg.handler === "chat_message") {

            handlePM(msg);
        }

    });

    socket.on("close", () => {

        console.log("[MAIN CLOSED]");

        setTimeout(() => {
            start(username, password);
        }, 5000);

    });

    socket.on("error", err => {
        console.log("[MAIN ERROR]", err.message);
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

async function handlePM(msg) {

    const from = msg.from;
    const body = (msg.body || "").trim();

    console.log("[PM]", from, body);

    if (body === "help") {

        return sendPM(from,

`BOT CREATOR

Create Bot:
j/room#username#password`
        );
    }

    // CREATE BOT
    if (body.startsWith("j/")) {

        const split =
            body.substring(2).split("#");

        const room = split[0];
        const username = split[1];
        const password = split[2];

        if (!room || !username || !password) {

            return sendPM(
                from,
                "Invalid format."
            );
        }

        // already active
        if (global.ACTIVE_CHILD_BOTS[room]) {

            return sendPM(
                from,
                "Room already has bot."
            );
        }

        sendPM(
            from,
            `Creating bot ${username}...`
        );

        ChildBot.start({
            room,
            username,
            password,
            owner: from
        });

    }

}

module.exports = {
    start,
    updateConsole
};
