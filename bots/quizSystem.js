const {
    loadJSON,
    saveJSON
} = require("./storage");

let active = {};
let timers = {};

function rand(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;

}

function startQuiz(socket, room) {

    if (timers[room]) return;

    console.log("[QUIZ START]", room);

    sendQuestion(socket, room);

    timers[room] = setInterval(() => {

        if (!socket) return;

        if (socket.readyState !== 1)
            return;

        sendQuestion(socket, room);

    }, 30000);

}

function stopQuiz(room) {

    if (timers[room]) {

        clearInterval(timers[room]);

        delete timers[room];

    }

    delete active[room];

    console.log("[QUIZ STOP]", room);

}

function sendQuestion(socket, room) {

    const a = rand(1, 20);
    const b = rand(1, 20);

    active[room] = {

        answer: String(a + b),

        locked: false

    };

    socket.send(JSON.stringify({

        handler: "room_message",

        type: "text",

        id: "QUIZ-" + Date.now(),

        body: `🧠 QUIZ: ${a} + ${b} = ?`,

        room: room,

        url: "",

        length: "0"

    }));

    console.log("[QUIZ SENT]", room);

}

function handleAnswer(
    socket,
    room,
    user,
    msg
) {

    const q = active[room];

    if (!q) return;

    if (q.locked) return;

    if (
        String(msg).trim() !== q.answer
    ) return;

    q.locked = true;

    let scores = loadJSON(
        "./storage/scores.json",
        {}
    );

    if (!scores[user]) {

        scores[user] = {
            score: 0
        };

    }

    scores[user].score += 1;

    saveJSON(
        "./storage/scores.json",
        scores
    );

    socket.send(JSON.stringify({

        handler: "room_message",

        type: "text",

        id: "WIN-" + Date.now(),

        body:
        `🏆 ${user} answered correctly!
Total Score: ${scores[user].score}`,

        room: room,

        url: "",

        length: "0"

    }));

    setTimeout(() => {

        sendQuestion(
            socket,
            room
        );

    }, 5000);

}

module.exports = {

    startQuiz,
    stopQuiz,
    handleAnswer

};
