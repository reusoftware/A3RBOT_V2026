const WebSocket = require("ws");

function generatePacketID() {
    return "BOT-" + Date.now();
}

function start(config) {

    try {

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        // =========================
        // CONNECT
        // =========================

        socket.on("open", () => {

            console.log(
                `[CHILDBOT CONNECTED] ${config.username}`
            );

            socket.send(JSON.stringify({
                handler: "login",
                username: config.username,
                password: config.password,
                id: generatePacketID()
            }));

        });

        // =========================
        // MESSAGE
        // =========================

        socket.on("message", async(data) => {

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
                        `[CHILDBOT LOGIN SUCCESS] ${config.username}`
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

                    console.log(
                        `[CHILDBOT LOGIN FAILED] ${config.username}`
                    );

                }

                // ROOM EVENT
                if (
                    msg.handler === "room_event"
                ) {

                    console.log(
                        `[ROOM EVENT] ${msg.type}`
                    );

                }

            } catch(err) {

                console.log(
                    "CHILDBOT MESSAGE ERROR:",
                    err
                );

            }

        });

        // =========================
        // ERROR
        // =========================

        socket.on("error", (err) => {

            console.log(
                "CHILDBOT SOCKET ERROR:",
                err
            );

        });

        // =========================
        // CLOSE
        // =========================

        socket.on("close", () => {

            console.log(
                `[CHILDBOT CLOSED] ${config.username}`
            );

        });

    } catch(err) {

        console.log(
            "CHILDBOT CRASH:",
            err
        );

    }

}

module.exports = {
    start
};
