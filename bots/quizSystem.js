const { loadJSON, saveJSON } = require("./storage");

let active = {};
let timers = {};

// ================================
// RANDOM
// ================================

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ================================
// START QUIZ (FIXED)
// ================================

function startQuiz(socket, room) {

    if (!room) return;

    // 🔥 ALWAYS RESET OLD TIMER FIRST (IMPORTANT FIX)
    stopQuiz(room);

    console.log("[QUIZ START]", room);

    sendQuestion(socket, room);

    timers[room] = setInterval(() => {

        if (!socket || socket.readyState !== 1) {
            stopQuiz(room);
            return;
        }

        sendQuestion(socket, room);

    }, 30000);
}

// ================================
// STOP QUIZ (SAFE)
// ================================

function stopQuiz(room) {

    if (timers[room]) {
        clearInterval(timers[room]);
        delete timers[room];
    }

    delete active[room];

    console.log("[QUIZ STOP]", room);
}

// ================================
// SEND QUESTION
// ================================

function sendQuestion(socket, room) {

    if (!socket || socket.readyState !== 1) return;

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

    console.log("[QUESTION SENT]", room);
}

// ================================
// HANDLE ANSWER
// ================================

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

    let gain = 10;

    if (time < 3) gain += 5;
    else if (time < 6) gain += 3;

    scores[user].score += gain;

    if (time < scores[user].best) {
        scores[user].best = time;
    }

    saveJSON("./storage/scores.json", scores);

    if (socket.readyState === 1) {

        socket.send(JSON.stringify({
            handler: "room_message",
            type: "text",
            room,
            body:
`🏆 ${user} CORRECT
⚡ ${time.toFixed(2)}s
➕ +${gain}
🏆 Total: ${scores[user].score}
🔥 Best: ${scores[user].best.toFixed(2)}s`,
            id: "WIN-" + Date.now()
        }));
    }

    setTimeout(() => {
        if (socket.readyState === 1) {
            sendQuestion(socket, room);
        }
    }, 4000);
}

module.exports = {
    startQuiz,
    stopQuiz,
    handleAnswer
};
