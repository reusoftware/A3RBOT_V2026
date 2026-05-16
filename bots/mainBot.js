
const WebSocket = require("ws");
const ChildBot = require("./childBot");
const { loadJSON, saveJSON } = require("./storage");

let socket = null;
let CHILD_BOTS = {};

function packet() {
    return "MAIN-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
}

function updatePanel() {

    try {

        if (
            global.uiSocket &&
            global.uiSocket.readyState === 1
        ) {

            const bots = Object.values(
                global.CHILD_CONNECTED || {}
            );

            global.uiSocket.send(JSON.stringify({

                type: "dashboard",

                bots,

                count: bots.length

            }));

            console.log(
                "[BOT COUNT]",
                bots.length
            );
        }

    } catch(err) {

        console.log("[UI ERROR]", err);

    }

}

function send(to, body) {

    try {

        if (!socket) return;
        if (socket.readyState !== 1) return;

        socket.send(JSON.stringify({
            handler: "chat_message",
            type: "text",
            to,
            body,
            id: packet()
        }));

    } catch (err) {
        console.log("[SEND ERROR]", err.message);
    }
}

function start(username, password) {

    return new Promise((resolve) => {

        socket = new WebSocket("wss://chatp.net:5333/server");

        let done = false;

        socket.on("open", () => {

            console.log("[MAIN CONNECTED]");

            socket.send(JSON.stringify({
                handler: "login",
                username,
                password,
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

                    console.log("[MAIN LOGIN SUCCESS]");

                    if (!done) {
                        done = true;
                        resolve({ success: true });
                    }

                    loadSavedBots();
                }

                if (msg.type === "failed") {

                    console.log("[MAIN LOGIN FAILED]");

                    if (!done) {
                        done = true;
                        resolve({ success: false });
                    }
                }
            }

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

        socket.on("error", (err) => {
            console.log("[MAIN ERROR]", err.message);
        });

        setInterval(() => {

            try {

                if (socket && socket.readyState === 1) {

                    socket.send(JSON.stringify({
                        handler: "ping",
                        id: packet()
                    }));
                }

            } catch {}

        }, 20000);

    });
}

function handlePM(msg) {

    const from = msg.from;
    const body = (msg.body || "").trim();

    console.log("[PM]", from, body);

    if (body.toLowerCase() === "help") {

        return send(from,
`BOT CREATOR

Create Bot:
j/room#username#password`
        );
    }

    if (body.startsWith("j/")) {
        createBot(from, body);
    }
}

async function createBot(owner, command) {

    try {

        const split = command.substring(2).split("#");

        const room = split[0];
        const username = split[1];
        const password = split[2];

        if (!room || !username || !password) {
            return send(owner, "Invalid format.");
        }

        if (CHILD_BOTS[room]) {
            return send(owner, "Room already has active bot.");
        }

        let bots = loadJSON("./storage/bots.json", []);

        bots = bots.filter(x => x && x.room && x.username);

        const existing = bots.find(x => x.room === room);

        if (existing && !CHILD_BOTS[room]) {
            bots = bots.filter(x => x.room !== room);
        }

        const config = {
            room,
            username,
            password,
            owner,
            roomMasters: [],
            welcome: true,
            quiz: false
        };

        send(owner, `Creating bot ${username}...`);

        const result = await ChildBot.start(config);

        if (!result.success) {
            return send(owner, "Bot failed login/join.");
        }

        CHILD_BOTS[room] = {
            room,
            username,
            socket: result.socket
        };

        bots.push(config);

        saveJSON("./storage/bots.json", bots);

        updatePanel();

        send(owner,
`BOT SUCCESSFULLY CREATED

Room: ${room}
Bot: ${username}`
        );

    } catch (err) {

        console.log("[CREATE ERROR]", err);

        send(owner, "Bot crashed.");
    }
}

async function loadSavedBots() {

    const bots = loadJSON("./storage/bots.json", []);

    console.log("[LOADING SAVED BOTS]", bots.length);

    for (const bot of bots) {

        try {

            if (CHILD_BOTS[bot.room]) continue;

            const result = await ChildBot.start(bot);

            if (result.success) {

                CHILD_BOTS[bot.room] = {
                    room: bot.room,
                    username: bot.username,
                    socket: result.socket
                };

                console.log("[RECONNECTED]", bot.username);
            }

        } catch (err) {
            console.log("[LOAD BOT ERROR]", err.message);
        }
    }

    updatePanel();
}

function removeBot(room) {

    if (CHILD_BOTS[room]) {

        delete CHILD_BOTS[room];

        updatePanel();
    }
}

module.exports = {
    start,
    removeBot,
    CHILD_BOTS
};

