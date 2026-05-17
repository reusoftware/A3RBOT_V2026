const {
    loadJSON,
    saveJSON
} = require("./storage");

let active = {};
let timers = {};

const words = [

    {
        question: "Capital of Japan?",
        answer: "tokyo"
    },

    {
        question: "2 colors of PH flag?",
        answer: "red blue"
    },

    {
        question: "Largest planet?",
        answer: "jupiter"
    },

    {
        question: "Fastest land animal?",
        answer: "cheetah"
    },

    {
        question: "What planet do we live on?",
        answer: "earth"
    }

];

// =====================================
// RANDOM NUMBER
// =====================================

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

}

// =====================================
// CREATE QUESTION
// =====================================

function createQuestion(socket, room) {

    if (!socket) return;

    if (socket.readyState !== 1)
        return;

    let question = "";
    let answer = "";

    const mode = rand(1, 4);

    // ADDITION
    if (mode === 1) {

        const a = rand(1, 30);
        const b = rand(1, 30);

        question = `${a} + ${b}`;
        answer = String(a + b);

    }

    // SUBTRACT
    else if (mode === 2) {

        const a = rand(10, 50);
        const b = rand(1, 10);

        question = `${a} - ${b}`;
        answer = String(a - b);

    }

    // MULTIPLY
    else if (mode === 3) {

        const a = rand(1, 12);
        const b = rand(1, 12);

        question = `${a} × ${b}`;
        answer = String(a * b);

    }

    // WORD QUESTION
    else {

        const pick =
            words[
                rand(0, words.length - 1)
            ];

        question = pick.question;
        answer = pick.answer;

    }

    active[room] = {

        question,

        answer: String(answer)
            .toLowerCase()
            .trim(),

        repeat: 0,

        locked: false,

        time: Date.now()

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

`❓ Question #1

${q.question}`,

`🧠 Please answer:

${q.question}`,

`⚡ Fast answer wins!

${q.question}`,

`🔥 Nobody knows?

${q.question}`,

`🎯 Last chance!

${q.question}`

    ];

    sendRoom(
        socket,
        room,
        styles[q.repeat - 1]
    );

    // LAST REPEAT
    if (q.repeat >= 5) {

        timers[room] = setTimeout(() => {

            if (
                active[room] &&
                !active[room].locked
            ) {

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

    const text =
        String(msg)
        .toLowerCase()
        .trim();

    if (text !== q.answer)
        return;

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

    // RANDOM BONUS
    let gain = rand(5, 50);

    // SPEED BONUS
    if (speed <= 3)
        gain += 20;

    else if (speed <= 5)
        gain += 10;

    scores[user].score += gain;

    // BEST SPEED
    if (
        speed <
        scores[user].bestSpeed
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
// TOP 10
// =====================================

function getTop10() {

    const scores = loadJSON(
        "./storage/scores.json",
        {}
    );

    const arr =
        Object.entries(scores);

    arr.sort(
        (a, b) =>
        b[1].score - a[1].score
    );

    let text =
`🏆 TOP 10 PLAYERS 🏆`;

    arr.slice(0, 10)
    .forEach((x, i) => {

        text +=

`\n\n${i + 1}. ${x[0]}
Score: ${x[1].score}
Best: ${x[1].bestSpeed.toFixed(2)}s`;

    });

    return text;

}

// =====================================
// MYSCORE
// =====================================

function getMyScore(user) {

    const scores = loadJSON(
        "./storage/scores.json",
        {}
    );

    if (!scores[user]) {

        return
        `${user} has no score yet.`;

    }

    return

`🏅 ${user}

Score:
${scores[user].score}

Best Speed:
${scores[user].bestSpeed.toFixed(2)}s`;

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

            body,

            room,

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
    handleAnswer,
    getTop10,
    getMyScore

};
