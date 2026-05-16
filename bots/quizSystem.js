const { loadJSON, saveJSON } = require("./storage");

let active = {};
let timers = {};

function startQuiz(socket, room) {

    stopQuiz(room); // IMPORTANT FIX

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

    clearInterval(timers[room]);
    delete timers[room];
    delete active[room];
}

function sendQuestion(socket, room) {

    const a = rand(1, 20);
    const b = rand(1, 20);

    active[room] = {
        answer: String(a + b),
        time: Date.now()
    };

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body: `🧠 ${a} + ${b} = ?`,
        id: "quiz-" + Date.now()
    }));
}

function handleAnswer(socket, room, user, msg) {

    const q = active[room];
    if (!q) return;

    if (msg !== q.answer) return;

    const time = Date.now() - q.time;

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body: `🏆 ${user} correct in ${time}ms`,
        id: "win-" + Date.now()
    }));

    sendQuestion(socket, room);
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
    startQuiz,
    stopQuiz,
    handleAnswer
};
