const { loadJSON, saveJSON } = require("./storage");

let activeQuiz = {};
let timers = {};

function startQuiz(socket, room) {

    if (!room || timers[room]) return;

    sendQuestion(socket, room);

    timers[room] = setInterval(() => {
        sendQuestion(socket, room);
    }, 30000);
}

function sendQuestion(socket, room) {

    const q = generateQuestion();

    activeQuiz[room] = {
        question: q.question,
        answer: q.answer,
        time: Date.now(),
        locked: false
    };

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body: `🧠 QUIZ: ${q.question}`,
        id: "quiz-" + Date.now()
    }));
}

function handleAnswer(socket, room, user, msg) {

    const quiz = activeQuiz[room];
    if (!quiz || quiz.locked) return;

    if (String(msg).trim() !== quiz.answer) return;

    quiz.locked = true;

    const time = (Date.now() - quiz.time) / 1000;

    let scores = loadJSON("./storage/scores.json", {});

    if (!scores[user]) {
        scores[user] = { score: 0, best: 999 };
    }

    let bonus = time < 3 ? 5 : time < 6 ? 3 : 0;
    let gain = 10 + bonus;

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
🏆 Total ${scores[user].score}
🔥 Best ${scores[user].best.toFixed(2)}s`,
        id: "win-" + Date.now()
    }));

    setTimeout(() => {
        sendQuestion(socket, room);
    }, 2000);
}

function generateQuestion() {

    const a = Math.floor(Math.random() * 20 + 1);
    const b = Math.floor(Math.random() * 20 + 1);

    return {
        question: `${a} + ${b} = ?`,
        answer: String(a + b)
    };
}

module.exports = {
    startQuiz,
    handleAnswer
};
