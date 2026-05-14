const WebSocket = require("ws");
const ChildBot = require("./childbots/childbot");

let socket = null;

// ========================================
// START MAIN BOT
// ========================================

async function start(username, password) {

    return new Promise((resolve) => {

        try {

            socket = new WebSocket("wss://chatp.net:5333/server");

            let finished = false;

            socket.onopen = () => {

                console.log("Socket Connected");

                socket.send(JSON.stringify({
                    handler: "login",
                    username,
                    password,
                    id: Date.now().toString()
                }));

            };

            socket.onmessage = async (event) => {

                let data;

                try {
                    data = JSON.parse(event.data);
                } catch {
                    return;
                }

                console.log("[MAINBOT RAW]", data);

                // ================= LOGIN SUCCESS =================
                if (
                    data.handler === "login_event" &&
                    data.type === "success"
                ) {

                    if (!finished) {

                        finished = true;

                        console.log("MAINBOT LOGIN SUCCESS");

                        resolve({
                            success: true,
                            message: "Login Success"
                        });
                    }
                }

                // ================= LOGIN FAILED =================
                if (
                    data.handler === "login_event" &&
                    (data.type === "failed" || data.type === "error")
                ) {

                    if (!finished) {

                        finished = true;

                        resolve({
                            success: false,
                            message: "Wrong credentials"
                        });
                    }
                }

                // ================= PRIVATE MESSAGE =================
                if (data.handler === "chat_message") {

                    const from = data.from;
                    const body = data.body;

                    if (!body) return;

                    // HELP COMMAND
                    if (body.toLowerCase() === "help") {

                        sendPrivate(from,
`SERVER BOT GUIDE

Create ChildBot:
j/room#username#password

Example:
j/myroom#bot1#123456`
                        );
                    }

                    // CREATE CHILDBOT
                    if (body.startsWith("j/")) {
                        handleChildRequest(data);
                    }
                }
            };

            socket.onerror = (err) => {
                console.log("Socket Error", err);
            };

            socket.onclose = () => {
                console.log("Socket Closed");
            };

            // timeout
            setTimeout(() => {
                if (!finished) {
                    finished = true;
                    resolve({
                        success: false,
                        message: "Login Timeout"
                    });
                }
            }, 10000);

        } catch (err) {
            resolve({
                success: false,
                message: "Server Error"
            });
        }
    });
}

// ========================================
// SEND PRIVATE MESSAGE
// ========================================

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

// ========================================
// HANDLE CHILD REQUEST
// ========================================

function handleChildRequest(data) {

    const from = data.from;
    const body = data.body;

    const text = body.replace("j/", "");
    const split = text.split("#");

    if (split.length < 3) {
        return sendPrivate(from, "Wrong format: j/room#user#pass");
    }

    const [room, botUsername, botPassword] = split;

    console.log("STARTING CHILDBOT:", room, botUsername);

    sendPrivate(from, "Starting ChildBot...");

    // 👉 START CHILD BOT HERE (IMPORTANT FIX)
    ChildBot.start({
        room,
        username: botUsername,
        password: botPassword
    }).then(res => {

        console.log("CHILDBOT RESULT:", res);

        sendPrivate(
            from,
            `ChildBot Done!\nSuccess: ${res.success}\nStage: ${res.stage}`
        );
    });
}

module.exports = { start };
