const WebSocket = require("ws");

let socket = null;

async function start(username, password) {

    return new Promise((resolve) => {

        try {

            socket = new WebSocket(
                "wss://chatp.net:5333/server"
            );

            let finished = false;

            socket.onopen = () => {

                console.log("Socket Connected");

                socket.send(JSON.stringify({
                    handler: "login",
                    username: username,
                    password: password,
                    id: Date.now().toString()
                }));

            };

            socket.onmessage = (event) => {

                console.log(event.data);

                let data;

                try {

                    data = JSON.parse(event.data);

                } catch {

                    return;

                }

                // LOGIN SUCCESS
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

                // LOGIN FAILED
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

            };

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

            socket.onclose = () => {

                console.log("Socket Closed");

            };

            // TIMEOUT FIX
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

module.exports = {
    start
};
