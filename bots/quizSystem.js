const { loadJSON, saveJSON } = require("./storage");

let active = {};
let timers = {};

function startQuiz(socket, room) {

    if (!room || timers[room]) return;

    sendQuestion(socket, room);

    timers[room] = setInterval(() => {
        sendQuestion(socket, room);
    }, 30000);
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
        id: "quiz-" + Date.now()
    }));
}

function handleAnswer(socket, room, user, msg) {

    const q = active[room];
    if (!q || q.locked) return;

    if (msg !== q.answer) return;

    q.locked = true;

    const time = (Date.now() - q.time) / 1000;

    let scores = loadJSON("./storage/scores.json", {});

    if (!scores[user]) {
        scores[user] = { score: 0, best: 999 };
    }

    const gain = 10 + (time < 3 ? 5 : time < 6 ? 3 : 0);

    scores[user].score += gain;
    scores[user].best = Math.min(scores[user].best, time);

    saveJSON("./storage/scores.json", scores);

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body:
`🏆 ${user}
⚡ ${time.toFixed(2)}s
➕ +${gain}
🏆 ${scores[user].score}
🔥 ${scores[user].best.toFixed(2)}s`,
        id: "win-" + Date.now()
    }));

    setTimeout(() => sendQuestion(socket, room), 3000);
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    startQuiz,
    handleAnswer
};
