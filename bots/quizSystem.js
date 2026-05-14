const {
    loadJSON,
    saveJSON
} = require("./storage");

let activeQuiz = {}; 
// room -> { question, answer, startTime }

let timers = {};

// ======================================
// START QUIZ
// ======================================

function startQuiz(socket, room) {

    if (!room) return;

    // prevent multiple loops
    if (timers[room]) return;

    console.log("[QUIZ STARTED]", room);

    sendQuestion(socket, room);

    timers[room] = setInterval(() => {

        sendQuestion(socket, room);

    }, 30000); // every 30 sec

}

// ======================================
// SEND QUESTION
// ======================================

function sendQuestion(socket, room) {

    const q = generateQuestion();

    activeQuiz[room] = {
        question: q.question,
        answer: q.answer,
        startTime: Date.now()
    };

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body: `🧠 QUIZ: ${q.question}`,
        id: "quiz-" + Date.now()
    }));

}

// ======================================
// SIMPLE QUESTION GENERATOR
// ======================================

function generateQuestion() {

    const a = Math.floor(Math.random() * 20);
    const b = Math.floor(Math.random() * 20);
    const op = ["+", "-", "*"][Math.floor(Math.random() * 3)];

    let answer;

    if (op === "+") answer = a + b;
    if (op === "-") answer = a - b;
    if (op === "*") answer = a * b;

    return {
        question: `${a} ${op} ${b} = ?`,
        answer: answer.toString()
    };
}

// ======================================
// HANDLE ANSWER
// ======================================

function handleAnswer(socket, room, user, message) {

    const quiz = activeQuiz[room];

    if (!quiz) return;

    if (message !== quiz.answer) return;

    const now = Date.now();
    const timeTaken = (now - quiz.startTime) / 1000;

    let scores = loadJSON("./storage/scores.json", {});

    if (!scores[user]) {

        scores[user] = {
            score: 0,
            bestTime: null
        };

    }

    // SCORE SYSTEM
    const baseScore = 10;

    let bonus = 0;

    if (timeTaken < 3) bonus = 5;
    else if (timeTaken < 6) bonus = 3;

    const totalGain = baseScore + bonus;

    scores[user].score += totalGain;

    // BEST TIME
    if (
        !scores[user].bestTime ||
        timeTaken < scores[user].bestTime
    ) {
        scores[user].bestTime = timeTaken;
    }

    saveJSON("./storage/scores.json", scores);

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body:
`✅ ${user} CORRECT!

⚡ Time: ${timeTaken.toFixed(2)}s
➕ Score +${totalGain}
🏆 Total: ${scores[user].score}
🔥 Best Time: ${scores[user].bestTime.toFixed(2)}s`
    }));

    // NEW QUESTION AFTER CORRECT
    setTimeout(() => {
        sendQuestion(socket, room);
    }, 2000);
}

// ======================================

module.exports = {
    startQuiz,
    handleAnswer
};
