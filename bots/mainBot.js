const WebSocket = require("ws");

let socket = null;

// ========================================
// START MAIN BOT
// ========================================

async function start(username, password) {

    return new Promise((resolve) => {

        try {

            socket = new WebSocket(
                "wss://chatp.net:5333/server"
            );

            let finished = false;

            // =========================
            // CONNECTED
            // =========================

            socket.onopen = () => {

                console.log("Socket Connected");

                socket.send(JSON.stringify({

                    handler: "login",

                    username: username,
                    password: password,

                    id: Date.now().toString()

                }));

            };

            // =========================
            // RECEIVE MESSAGE
            // =========================

            socket.onmessage = async (event) => {

                console.log("RAW:", event.data);

                let data;

                try {

                    data = JSON.parse(event.data);

                } catch {

                    return;

                }

                // =========================
                // LOGIN SUCCESS
                // =========================

                if (
                    data.handler === "login_event" &&
                    data.type === "success"
                ) {

                    if (!finished) {

                        finished = true;

                        console.log("LOGIN SUCCESS");

                        resolve({
                            success: true,
                            message: "Login Success"
                        });

                    }

                }

                // =========================
                // LOGIN FAILED
                // =========================

                if (
                    data.handler === "login_event" &&
                    (
                        data.type === "failed" ||
                        data.type === "error"
                    )
                ) {

                    if (!finished) {

                        finished = true;

                        console.log("LOGIN FAILED");

                        resolve({
                            success: false,
                            message: "Wrong Username Or Password"
                        });

                    }

                }

                // =========================
                // PRIVATE MESSAGE
                // =========================

                if (
                    data.handler === "chat_message"
                ) {

                    console.log("PRIVATE MESSAGE RECEIVED");

                    console.log(data);

                    const from = data.from;
                    const body = data.body;

                    if (!body) return;

                    // =====================
                    // HELP COMMAND
                    // =====================

                    if (
                        body.toLowerCase() === "help"
                    ) {

                        sendPrivate(
                            from,

                            "SERVER FUN BOT GUIDE\n\n" +

                            "Request ChildBot Format:\n" +

                            "j/roomname#botusername#botpassword\n\n" +

                            "Example:\n" +

                            "j/myroom#childbot#123456"

                        );

                    }

                    // =====================
                    // CREATE CHILDBOT
                    // =====================

                    if (
                        body.startsWith("j/")
                    ) {

                        handleChildRequest(data);

                    }

                }

            };

            // =========================
            // SOCKET ERROR
            // =========================

            socket.onerror = (err) => {

                console.log("Socket Error", err);

                if (!finished) {

                    finished = true;

                    resolve({
                        success: false,
                        message: "Socket Error"
                    });

                }

            };

            // =========================
            // SOCKET CLOSE
            // =========================

            socket.onclose = () => {

                console.log("Socket Closed");

            };

            // =========================
            // LOGIN TIMEOUT
            // =========================

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

            console.log(err);

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

        url: "",

        length: "0",

        id: Date.now().toString()

    }));

}

// ========================================
// HANDLE CHILDBOT REQUEST
// ========================================

function handleChildRequest(data) {

    try {

        const from = data.from;

        const body = data.body;

        const text = body.replace("j/", "");

        const split = text.split("#");

        if (split.length < 3) {

            sendPrivate(

                from,

                "Wrong Format!\n\nUse:\n" +

                "j/roomname#botusername#botpassword"

            );

            return;

        }

        const room = split[0];
        const botUsername = split[1];
        const botPassword = split[2];

        console.log("CREATE CHILDBOT");

        console.log(room);
        console.log(botUsername);

        // =========================
        // HERE LATER YOU WILL:
        // 1. SAVE BOT
        // 2. START CHILD BOT
        // 3. SAVE ROOM SETTINGS
        // =========================

        sendPrivate(

            from,

            "ChildBot Request Received!\n\n" +

            "Room: " + room + "\n" +

            "Bot Username: " + botUsername

        );

    } catch (err) {

        console.log(err);

    }

}

// ========================================

module.exports = {
    start
};
