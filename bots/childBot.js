const WebSocket = require("ws");

function generatePacketID() {
    return "BOT-" + Date.now();
}

async function start(config) {

    return new Promise((resolve) => {

        try {

            const socket = new WebSocket(
                "wss://chatp.net:5333/server"
            );

            let resolved = false;

            socket.on("open", () => {

                console.log(
                    "[CHILDBOT CONNECTED]",
                    config.username
                );

                socket.send(JSON.stringify({

                    handler: "login",
                    username: config.username,
                    password: config.password,
                    id: generatePacketID()

                }));

            });

            socket.on("message", (data) => {

                try {

                    const msg = JSON.parse(data);

                    console.log(
                        "[CHILDBOT RAW]",
                        msg
                    );

                    // LOGIN SUCCESS
                    if (
                        msg.handler === "login_event" &&
                        msg.type === "success"
                    ) {

                        console.log(
                            "[CHILDBOT LOGIN SUCCESS]"
                        );

                        socket.send(JSON.stringify({

                            handler: "room_join",
                            name: config.room,
                            id: generatePacketID()

                        }));

                    }

                    // LOGIN FAILED
                    if (
                        msg.handler === "login_event" &&
                        (
                            msg.type === "failed" ||
                            msg.type === "error"
                        )
                    ) {

                        if (!resolved) {

                            resolved = true;

                            resolve({
                                success: false,
                                stage: "login_failed"
                            });

                        }

                    }

                    // ROOM JOINED
                    if (
                        msg.handler === "room_event"
                    ) {

                        console.log(
                            "[ROOM EVENT]",
                            msg.type
                        );

                        if (!resolved) {

                            resolved = true;

                            resolve({
                                success: true,
                                stage: "joined_room"
                            });

                        }

                    }

                } catch(err) {

                    console.log(
                        "MESSAGE ERROR:",
                        err
                    );

                }

            });

            socket.on("error", (err) => {

                console.log(
                    "CHILDBOT SOCKET ERROR:",
                    err
                );

                if (!resolved) {

                    resolved = true;

                    resolve({
                        success: false,
                        stage: "socket_error"
                    });

                }

            });

            socket.on("close", () => {

                console.log(
                    "CHILDBOT CLOSED"
                );

            });

            setTimeout(() => {

                if (!resolved) {

                    resolved = true;

                    resolve({
                        success: false,
                        stage: "timeout"
                    });

                }

            }, 20000);

        } catch(err) {

            console.log(
                "CHILDBOT CRASH:",
                err
            );

            resolve({
                success: false,
                stage: "crashed"
            });

        }

    });

}

module.exports = {
    start
};
