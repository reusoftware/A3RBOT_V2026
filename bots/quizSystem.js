const { loadJSON, saveJSON } = require("./storage");

let active = {};
let timers = {};

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startQuiz(socket, room) {

    if (!room) return;

    if (timers[room]) return;

    sendQuestion(socket, room);

    timers[room] = setInterval(() => {

        sendQuestion(socket, room);

    }, 30000);
}

function stopQuiz(room) {

    if (timers[room]) {

        clearInterval(timers[room]);

        delete timers[room];
    }

    delete active[room];
}

function sendQuestion(socket, room) {

    if (socket.readyState !== 1) return;

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
        id: "QUIZ-" + Date.now()
    }));
}

function handleAnswer(socket, room, user, msg) {

    const q = active[room];

    if (!q) return;
    if (q.locked) return;

    if (String(msg).trim() !== q.answer) return;

    q.locked = true;

    const time = (Date.now() - q.time) / 1000;

    let scores = loadJSON("./storage/scores.json", {});

    if (!scores[user]) {
        scores[user] = {
            score: 0,
            best: 999
        };
    }

    const gain = 10 + (time < 3 ? 5 : time < 6 ? 3 : 0);

    scores[user].score += gain;

    if (time < scores[user].best) {
        scores[user].best = time;
    }

    saveJSON("./storage/scores.json", scores);

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body:
`🏆 ${user} CORRECT
⚡ ${time.toFixed(2)}s
➕ +${gain}
🏆 Total ${scores[user].score}`,
        id: "WIN-" + Date.now()
    }));

    setTimeout(() => {
        sendQuestion(socket, room);
    }, 5000);
}

module.exports = {
    startQuiz,
    stopQuiz,
    handleAnswer
};
