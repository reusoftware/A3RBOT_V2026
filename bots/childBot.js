const WebSocket = require("ws");
const ytSearch = require("yt-search");
const QuizSystem = require("./quizSystem");

const {
    loadJSON,
    saveJSON
} = require("./storage");

function packet() {

    return (
        "BOT-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 9999)
    );

}
function sendAdmin(socket, room, payload) {

    try {

        socket.send(JSON.stringify({

            handler: "room_admin",
            ...payload,
            room,
            id: packet()

        }));

    } catch (err) {
        console.log("[ADMIN ERROR]", err.message);
    }

}

// KICK
function kick(socket, room, user) {

    sendAdmin(socket, room, {
        type: "kick",
        t_username: user
    });

}

// ROLE CHANGE
function setRole(socket, room, user, role) {

    sendAdmin(socket, room, {
        type: "change_role",
        t_username: user,
        t_role: role
    });

}
// =====================================
// SEND ROOM MESSAGE
// =====================================

function sendRoomMessage(socket, room, body) {

    try {

        if (!socket || socket.readyState !== 1) return;

        const msg = JSON.stringify({
            handler: "room_message",
            type: "text",
            id: packet(),
            body: String(body).slice(0, 1500), // 🔥 LIMIT SIZE
            room,
            url: "",
            length: "0"
        });

        socket.send(msg);

    } catch (err) {
        console.log("[SEND ERROR]", err.message);
    }

}

async function sendAudio(socket, room, audioUrl) {

    try {

        if (!socket) return;

        if (socket.readyState !== 1)
            return;

        socket.send(JSON.stringify({

            handler: "room_message",

            type: "audio",

            id: packet(),

            body: "",

            room: room,

            url: audioUrl,

            length: "10000"

        }));

        console.log("[AUDIO SENT]");

    } catch (err) {

        console.log(
            "[AUDIO ERROR]",
            err.message
        );

    }

}

// =====================================
// SEARCH SONG
// =====================================
async function searchSongAudio(query) {

    try {

        const result = await ytSearch(query);

        if (!result.videos.length) return null;

        const video = result.videos[0];

        // 🔥 GET STREAM (REAL AUDIO STREAM)
        const stream = await play.stream(video.url);

        return {

            title: video.title,
            url: stream.url,   // ✅ THIS is direct stream
            author: video.author.name,
            duration: video.timestamp

        };

    } catch (err) {

        console.log("[SONG ERROR]", err.message);
        return null;

    }

}
//=========================
// SAVE BOT CONFIG
// =====================================

function saveBotConfig(config) {

    let bots = loadJSON(
        "./storage/bots.json",
        []
    );

    const index = bots.findIndex(
        x => x.room === config.room
    );

    if (index !== -1) {

        bots[index] = config;

        saveJSON(
            "./storage/bots.json",
            bots
        );

    }

}

// =====================================
// START BOT
// =====================================

function start(config) {

    return new Promise((resolve) => {

        if (!config.roomMasters)
            config.roomMasters = [];

        if (config.welcome === undefined)
            config.welcome = true;

        if (config.quiz === undefined)
            config.quiz = true;

        const socket = new WebSocket(
            "wss://chatp.net:5333/server"
        );

        let resolved = false;

        console.log(
            "[BOT STARTING]",
            config.username
        );

        // ================= OPEN =================

        socket.on("open", () => {

            console.log(
                "[BOT CONNECTED]",
                config.username
            );

            socket.send(JSON.stringify({

                handler: "login",

                username: config.username,

                password: config.password,

                id: packet()

            }));

        });

        // ================= MESSAGE =================

        socket.on("message", async(data) => {

            let msg;

            try {

                msg = JSON.parse(
                    data.toString()
                );

            } catch {

                return;

            }

            console.log(
                "[BOT RAW]",
                msg
            );

            // ================= LOGIN =================

            if (
                msg.handler === "login_event"
            ) {

                if (msg.type === "success") {

                    console.log(
                        "[LOGIN SUCCESS]",
                        config.username
                    );

                    socket.send(JSON.stringify({

                        handler: "room_join",

                        name: config.room,

                        id: packet()

                    }));

                }

                if (
                    msg.type === "failed" ||
                    msg.type === "error"
                ) {

                    console.log(
                        "[LOGIN FAILED]",
                        config.username
                    );

                    if (!resolved) {

                        resolved = true;

                        resolve({
                            success: false
                        });

                    }

                }

            }

            // ================= ROOM EVENT =================

            if (
                msg.handler === "room_event"
            ) {

                // ROOM JOINED
                if (
                    msg.type === "you_joined"
                ) {
saveBotConfig(config);
                    console.log(
                        "[ROOM JOINED]",
                        config.room
                    );

                    if (!resolved) {

                        resolved = true;

                        resolve({
                            success: true,
                            socket
                        });

                    }

                    setTimeout(() => {

                        sendRoomMessage(
                            socket,
                            config.room,
                            "Im a Bot and ready to work!"
                        );

                    }, 10000);

                    // AUTO QUIZ
                    if (config.quiz) {

                        setTimeout(() => {

                            QuizSystem.startQuiz(
                                socket,
                                config.room
                            );

                        }, 20000);

                    }

                }

                await handleRoomEvent(
                    socket,
                    config,
                    msg
                );

            }

        });

        // ================= CLOSE =================

        socket.on("close", () => {

            console.log(
                "[BOT CLOSED]",
                config.username
            );

        });

        // ================= ERROR =================

        socket.on("error", (err) => {

            console.log(
                "[BOT ERROR]",
                err.message
            );

            if (!resolved) {

                resolved = true;

                resolve({
                    success: false
                });

            }

        });

        // ================= KEEP ALIVE =================

        setInterval(() => {

            try {

                if (
                    socket.readyState === 1
                ) {

                    socket.send(JSON.stringify({

                        handler: "ping",

                        id: packet()

                    }));

                }

            } catch {}

        }, 25000);

    });

}

// =====================================
// ROOM EVENTS
// =====================================

async function handleRoomEvent(
    socket,
    config,
    msg
) {

    const type = msg.type;

    // USER JOINED
if (type === "user_joined") {

    const username =
        msg.username ||
        msg.from ||
        "User";

    // welcome
    if (config.welcome) {

        sendRoomMessage(
            socket,
            config.room,
            `Welcome ${username}`
        );

    }

    // AUTO MEMBER
    if (config.autoMember) {

        setTimeout(() => {

            setRole(
                socket,
                config.room,
                username,
                "member"
            );

        }, 2000);

    }

    // AUTO BAN (if not master or owner)
    if (config.autoBan) {

        const isMaster =
            config.roomMasters.includes(username) ||
            username === config.owner;

        if (!isMaster) {

            setTimeout(() => {

                kick(
                    socket,
                    config.room,
                    username
                );

            }, 2000);

        }

    }

    return;
}

    // ONLY TEXT MESSAGE
    if (!msg.body) return;

    const body =
        String(msg.body)
        .toLowerCase()
        .trim();

    const from =
        msg.from ||
        msg.username ||
        "Unknown";

    console.log(
        `[ROOM] ${from}: ${body}`
    );

    const isMainMaster =
        from === config.owner;

    const isRoomMaster =
        config.roomMasters.includes(from);

    const isMaster =
        isMainMaster || isRoomMaster;

    // =====================================
    // HELP
    // =====================================

    if (body === "help") {

        return sendRoomMessage(
            socket,
            config.room,

`📖 COMMANDS

help
myscore
top
rtop
maslist
song+title
+quiz
-quiz

+wc
-wc
+am = auto member
-am 
+ab = auto banned
-ab
mas+username
mas-username
kick@user
ban@user
ad@user
mem@user
ow@user`
        );

    }
if (body === "+am") {

    if (!isMaster) return;

    config.autoMember = true;
    saveBotConfig(config);

    return sendRoomMessage(
        socket,
        config.room,
        "✅ Auto Member ENABLED"
    );

}

if (body === "-am") {

    if (!isMaster) return;

    config.autoMember = false;
    saveBotConfig(config);

    return sendRoomMessage(
        socket,
        config.room,
        "❌ Auto Member DISABLED"
    );

}

if (body === "+ab") {

    if (!isMaster) return;

    config.autoBan = true;
    saveBotConfig(config);

    return sendRoomMessage(
        socket,
        config.room,
        "🚫 Auto Ban ENABLED"
    );

}

if (body === "-ab") {

    if (!isMaster) return;

    config.autoBan = false;
    saveBotConfig(config);

    return sendRoomMessage(
        socket,
        config.room,
        "✅ Auto Ban DISABLED"
    );

}

    if (body.startsWith("kick@")) {

    if (!isMaster) return;

    const user = body.replace("kick@", "").trim();

    kick(socket, config.room, user);

    return sendRoomMessage(socket, config.room,
        `👢 Kicked ${user}`
    );

}

if (body.startsWith("ban@")) {

    if (!isMaster) return;

    const user = body.replace("ban@", "").trim();

    setRole(socket, config.room, user, "outcast");

    return sendRoomMessage(socket, config.room,
        `⛔ Banned ${user}`
    );

}

if (body.startsWith("ad@")) {

    if (!isMaster) return;

    const user = body.replace("ad@", "").trim();

    setRole(socket, config.room, user, "admin");

    return sendRoomMessage(socket, config.room,
        `🛡️ ${user} is now ADMIN`
    );

}

if (body.startsWith("mem@")) {

    if (!isMaster) return;

    const user = body.replace("mem@", "").trim();

    setRole(socket, config.room, user, "member");

    return sendRoomMessage(socket, config.room,
        `👤 ${user} is now MEMBER`
    );

}

if (body.startsWith("ow@")) {

    if (!isMaster) return;

    const user = body.replace("ow@", "").trim();

    setRole(socket, config.room, user, "owner");

    return sendRoomMessage(socket, config.room,
        `👑 ${user} is now OWNER`
    );

}
    // =====================================
    // MASTER LIST
    // =====================================

    if (body === "maslist") {

        return sendRoomMessage(
            socket,
            config.room,

            config.roomMasters.length === 0
                ? "No room masters."
                : `👑 ROOM MASTERS

${config.roomMasters.join("\n")}`

        );

    }

    // =====================================
    // ADD MASTER
    // =====================================

    if (body.startsWith("mas+")) {

        if (!isMaster) return;

        const target =
            body.replace(
                "mas+",
                ""
            ).trim();

        if (!target)
            return;

        if (
            !config.roomMasters.includes(target)
        ) {

            config.roomMasters.push(target);

            saveBotConfig(config);

        }

        return sendRoomMessage(
            socket,
            config.room,
            `${target} added as Room Master.`
        );

    }

    // =====================================
    // REMOVE MASTER
    // =====================================

    if (body.startsWith("mas-")) {

        if (!isMaster) return;

        const target =
            body.replace(
                "mas-",
                ""
            ).trim();

        config.roomMasters =
            config.roomMasters.filter(
                x => x !== target
            );

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            `${target} removed.`
        );

    }

    // =====================================
    // QUIZ ON
    // =====================================

    if (body === "+quiz") {

        if (!isMaster) return;

        config.quiz = true;

        saveBotConfig(config);

        QuizSystem.startQuiz(
            socket,
            config.room
        );

        return sendRoomMessage(
            socket,
            config.room,
            "✅ Quiz enabled."
        );

    }

    // =====================================
    // QUIZ OFF
    // =====================================

    if (body === "-quiz") {

        if (!isMaster) return;

        config.quiz = false;

        saveBotConfig(config);

        QuizSystem.stopQuiz(
            config.room
        );

        return sendRoomMessage(
            socket,
            config.room,
            "❌ Quiz disabled."
        );

    }

    // =====================================
    // WELCOME ON
    // =====================================

    if (body === "+wc") {

        if (!isMaster) return;

        config.welcome = true;

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            "✅ Welcome enabled."
        );

    }

    // =====================================
    // WELCOME OFF
    // =====================================

    if (body === "-wc") {

        if (!isMaster) return;

        config.welcome = false;

        saveBotConfig(config);

        return sendRoomMessage(
            socket,
            config.room,
            "❌ Welcome disabled."
        );

    }



    
// =====================================
// SONG COMMAND
// =====================================

if (body.startsWith("song+")) {

    try {

        const query = msg.body.substring(5).trim();

        const song = await searchSongAudio(query);

        if (!song) {
            return sendRoomMessage(socket, config.room, "❌ Song not found");
        }

        sendRoomMessage(socket, config.room,
`🎵 ${song.title}
👤 ${song.author}
⏱ ${song.duration}`);

        await sendAudio(socket, config.room, song.url);

    } catch (err) {

        console.log("[SONG ERROR]", err.message);

        sendRoomMessage(socket, config.room, "⚠️ Audio failed");

    }

    return;
}
    // =====================================
    // HANDLE QUIZ ANSWER
    // =====================================

    if (config.quiz) {
// =====================================
// HINT
// =====================================

if (body === "hint") {

    const q =
        QuizSystem.activeQuiz(
            config.room
        );

    if (!q)
        return;

    return sendRoomMessage(
        socket,
        config.room,

`💡 HINT

${q.hint}`

    );

}
        QuizSystem.handleAnswer(
            socket,
            config.room,
            from,
            body
        );

    }

    // =====================================
    // MY SCORE
    // =====================================

    if (body === "myscore") {

        return sendRoomMessage(
            socket,
            config.room,
            QuizSystem.getMyScore(
                from,
                config.room
            )
        );

    }

    // =====================================
    // GLOBAL TOP 10
    // =====================================

    if (body === "top") {

        return sendRoomMessage(
            socket,
            config.room,
            QuizSystem.getTop10()
        );

    }

    // =====================================
    // ROOM TOP
    // =====================================

    if (body === "rtop") {

        return sendRoomMessage(
            socket,
            config.room,
            QuizSystem.getRoomTop(
                config.room
            )
        );

    }

}

module.exports = {
    start
};
