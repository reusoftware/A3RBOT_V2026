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

// =====================================
// START QUIZ
// =====================================

function startQuiz(socket, room) {

    if (timers[room]) return;

    console.log("[QUIZ START]", room);

    createQuestion(socket, room);

}

// =====================================
// STOP QUIZ
// =====================================

function stopQuiz(room) {

    if (timers[room]) {

        clearTimeout(timers[room]);

        delete timers[room];

    }

    delete active[room];

    console.log("[QUIZ STOP]", room);

}

// =====================================
// CREATE QUESTION
// =====================================

function createQuestion(socket, room) {

    if (!socket) return;

    if (socket.readyState !== 1)
        return;

    const a = rand(1, 20);
    const b = rand(1, 20);

    const answer = a + b;

    active[room] = {

        answer: String(answer),

        question: `${a} + ${b}`,

        time: Date.now(),

        locked: false,

        repeat: 0

    };

    askLoop(socket, room);

}

// =====================================
// ASK LOOP
// =====================================

function askLoop(socket, room) {

    const q = active[room];

    if (!q) return;

    if (q.locked) return;

    q.repeat++;

    const styles = [

        `❓ Question #${q.repeat}\n${q.question} = ?`,

        `🧠 Please answer:\n${q.question} = ?`,

        `⚡ Fast answer wins!\n${q.question} = ?`,

        `🔥 Nobody knows?\n${q.question} = ?`,

        `🎯 Last chance!\n${q.question} = ?`

    ];

    const text =
        styles[
            Math.min(
                q.repeat - 1,
                styles.length - 1
            )
        ];

    sendRoom(socket, room, text);

    // AFTER 5 POSTS
    if (q.repeat >= 5) {

        timers[room] = setTimeout(() => {

            if (!active[room]) return;

            if (!active[room].locked) {

                sendRoom(
                    socket,
                    room,

`⏰ Time's up!

Correct Answer:
${q.answer}`
                );

            }

            delete active[room];

            setTimeout(() => {

                createQuestion(
                    socket,
                    room
                );

            }, 5000);

        }, 5000);

        return;
    }

    // NEXT REPEAT
    timers[room] = setTimeout(() => {

        askLoop(socket, room);

    }, 5000);

}

// =====================================
// HANDLE ANSWER
// =====================================

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

    clearTimeout(timers[room]);

    const speed =
        (
            Date.now() - q.time
        ) / 1000;

    let scores = loadJSON(
        "./storage/scores.json",
        {}
    );

    if (!scores[user]) {

        scores[user] = {

            score: 0,

            bestSpeed: 9999

        };

    }

    // BONUS SCORE
    let gain = 10;

    if (q.repeat === 1)
        gain = 50;

    else if (q.repeat === 2)
        gain = 40;

    else if (q.repeat === 3)
        gain = 30;

    else if (q.repeat === 4)
        gain = 20;

    else gain = 10;

    scores[user].score += gain;

    // BEST SPEED
    if (
        speed < scores[user].bestSpeed
    ) {

        scores[user].bestSpeed =
            speed;

    }

    saveJSON(
        "./storage/scores.json",
        scores
    );

    sendRoom(
        socket,
        room,

`🏆 ${user} answered correctly!

⚡ Speed:
${speed.toFixed(2)}s

➕ Added Score:
${gain}

🏅 Total Score:
${scores[user].score}

🔥 Best Speed:
${scores[user].bestSpeed.toFixed(2)}s`
    );

    delete active[room];

    setTimeout(() => {

        createQuestion(
            socket,
            room
        );

    }, 5000);

}

// =====================================
// SEND ROOM
// =====================================

function sendRoom(
    socket,
    room,
    body
) {

    try {

        if (!socket) return;

        if (socket.readyState !== 1)
            return;

        socket.send(JSON.stringify({

            handler: "room_message",

            type: "text",

            id:
            "QUIZ-" + Date.now(),

            body: body,

            room: room,

            url: "",

            length: "0"

        }));

    } catch(err) {

        console.log(
            "[QUIZ SEND ERROR]",
            err.message
        );

    }

}

module.exports = {

    startQuiz,
    stopQuiz,
    handleAnswer

};
