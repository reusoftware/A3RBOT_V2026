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

    const type = Math.floor(Math.random() * 4);

    let question;
    let answer;

    // =========================
    // TYPE 1: ADDITION
    // =========================
    if (type === 0) {

        const a = rand(1, 50);
        const b = rand(1, 50);

        question = `${a} + ${b} = ?`;
        answer = a + b;
    }

    // =========================
    // TYPE 2: SUBTRACTION
    // =========================
    else if (type === 1) {

        const a = rand(20, 100);
        const b = rand(1, 20);

        question = `${a} - ${b} = ?`;
        answer = a - b;
    }

    // =========================
    // TYPE 3: MULTIPLICATION
    // =========================
    else if (type === 2) {

        const a = rand(1, 12);
        const b = rand(1, 12);

        question = `${a} × ${b} = ?`;
        answer = a * b;
    }

    // =========================
    // TYPE 4: MIX LOGIC
    // =========================
    else {

        const a = rand(2, 10);
        const b = rand(2, 10);
        const c = rand(1, 5);

        question = `(${a} + ${b}) × ${c} = ?`;
        answer = (a + b) * c;
    }

    return {
        question,
        answer: answer.toString()
    };
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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
