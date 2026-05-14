const WebSocket = require("ws");
const ChildBot = require("./childbot");

let socket = null;

async function start(username, password) {

    return new Promise((resolve) => {

        try {

            socket = new WebSocket(
                "wss://chatp.net:5333/server"
            );

            let finished = false;

            socket.on("open", () => {

                console.log("MAINBOT CONNECTED");

                socket.send(JSON.stringify({
                    handler: "login",
                    username,
                    password,
                    id: Date.now().toString()
                }));

            });

            socket.on("message", async(data) => {

                let msg;

                try {
                    msg = JSON.parse(data);
                } catch {
                    return;
                }

                console.log("[MAINBOT RAW]", msg);

                // LOGIN SUCCESS
                if (
                    msg.handler === "login_event" &&
                    msg.type === "success"
                ) {

                    if (!finished) {

                        finished = true;

                        console.log("MAINBOT LOGIN SUCCESS");

                        resolve({
                            success: true
                        });

                    }

                }

                // LOGIN FAILED
                if (
                    msg.handler === "login_event" &&
                    (
                        msg.type === "failed" ||
                        msg.type === "error"
                    )
                ) {

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: false
                        });

                    }

                }

                // PRIVATE MESSAGE
                if (
                    msg.handler === "chat_message"
                ) {

                    const from = msg.from;
                    const body = msg.body;

                    if (!body) return;

                    // HELP
                    if (
                        body.toLowerCase() === "help"
                    ) {

                        sendPrivate(
                            from,

`BOT GUIDE

Create ChildBot:
j/room#username#password

Example:
j/myroom#bot1#123456`
                        );

                    }

                    // CREATE BOT
                    if (
                        body.startsWith("j/")
                    ) {

                        handleChildRequest(msg);

                    }

                }

            });

            socket.on("error", (err) => {

                console.log(
                    "MAINBOT ERROR:",
                    err
                );

            });

            socket.on("close", () => {

                console.log(
                    "MAINBOT CLOSED"
                );

            });

            setTimeout(() => {

                if (!finished) {

                    finished = true;

                    resolve({
                        success: false,
                        message: "timeout"
                    });

                }

            }, 15000);

        } catch(err) {

            console.log(
                "MAINBOT CRASH:",
                err
            );

            resolve({
                success: false
            });

        }

    });

}

function sendPrivate(user, message) {

    if (!socket) return;

    socket.send(JSON.stringify({

        handler: "chat_message",
        type: "text",
        to: user,
        body: message,
        id: Date.now().toString()

    }));

}

async function handleChildRequest(msg) {

    try {

        const from = msg.from;

        const text = msg.body.replace("j/", "");

        const split = text.split("#");

        if (split.length < 3) {

            return sendPrivate(
                from,
                "Wrong format."
            );

        }

        const room = split[0];
        const username = split[1];
        const password = split[2];

        sendPrivate(
            from,
            "Starting ChildBot..."
        );

        console.log(
            "START BOT:",
            username
        );

        const result = await ChildBot.start({
            room,
            username,
            password
        });

        console.log(
            "CHILDBOT RESULT:",
            result
        );

        sendPrivate(
            from,

`ChildBot Result

Success: ${result.success}

Stage: ${result.stage}`
        );

    } catch(err) {

        console.log(
            "HANDLE CHILD ERROR:",
            err
        );

    }

}

module.exports = {
    start
};
