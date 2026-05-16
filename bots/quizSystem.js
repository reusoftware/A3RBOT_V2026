const { loadJSON, saveJSON } = require("./storage");

let active = {};
let timers = {};

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startQuiz(socket, room) {

    if (!socket || socket.readyState !== 1) return;

    stopQuiz(room);

    sendQuestion(socket, room);

    timers[room] = setInterval(() => {

        if (!socket || socket.readyState !== 1) {
            stopQuiz(room);
            return;
        }

        sendQuestion(socket, room);

    }, 30000);
}

function stopQuiz(room) {
    if (timers[room]) clearInterval(timers[room]);
    delete timers[room];
    delete active[room];
}

function sendQuestion(socket, room) {

    const a = rand(1, 20);
    const b = rand(1, 20);

    active[room] = {
        answer: String(a + b),
        time: Date.now(),
        locked: false
    };

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body: `🧠 QUIZ: ${a} + ${b} = ?`,
        id: "Q-" + Date.now()
    }));
}

function handleAnswer(socket, room, user, msg) {

    const q = active[room];
    if (!q || q.locked) return;

    if (msg !== q.answer) return;

    q.locked = true;

    const time = (Date.now() - q.time) / 1000;

    let scores = loadJSON("./storage/scores.json", {});
    if (!scores[user]) scores[user] = { score: 0, best: 999 };

    scores[user].score += 10;

    if (time < scores[user].best) {
        scores[user].best = time;
    }

    saveJSON("./storage/scores.json", scores);

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body: `${user} correct! +10`,
        id: "W-" + Date.now()
    }));

    setTimeout(() => sendQuestion(socket, room), 4000);
}

module.exports = {
    startQuiz,
    stopQuiz,
    handleAnswer
};
