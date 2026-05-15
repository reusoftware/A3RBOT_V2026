const {
    loadJSON,
    saveJSON
} = require("./storage");

// ======================================
// ACTIVE QUIZ STORAGE
// ======================================

let activeQuiz = {};
// room -> {
// question,
// answer,
// startTime,
// answered
// }

let timers = {};

// ======================================
// START QUIZ
// ======================================

function startQuiz(socket, room) {

    if (!room) return;

    // prevent multiple loops
    if (timers[room]) return;

    console.log(
        "[QUIZ STARTED]",
        room
    );

    // first question
    sendQuestion(socket, room);

    // auto loop
    timers[room] = setInterval(() => {

        // if current question already answered
        // next automatic question
        const current = activeQuiz[room];

        if (
            current &&
            current.answered
        ) {
            return;
        }

        sendQuestion(socket, room);

    }, 30000);

}

// ======================================
// STOP QUIZ
// ======================================

function stopQuiz(room) {

    if (timers[room]) {

        clearInterval(
            timers[room]
        );

        delete timers[room];

    }

    if (activeQuiz[room]) {

        delete activeQuiz[room];

    }

    console.log(
        "[QUIZ STOPPED]",
        room
    );

}

// ======================================
// SEND QUESTION
// ======================================

function sendQuestion(socket, room) {

    const q = generateQuestion();

    activeQuiz[room] = {

        question: q.question,

        answer: q.answer,

        startTime: Date.now(),

        answered: false

    };

    console.log(
        `[QUESTION]
Room: ${room}
Question: ${q.question}
Answer: ${q.answer}`
    );

    socket.send(JSON.stringify({

        handler: "room_message",

        type: "text",

        room,

        body:

`🧠 QUIZ QUESTION

${q.question}

Reply the correct answer.`,

        id: "quiz-" + Date.now()

    }));

}

// ======================================
// RANDOM QUESTION GENERATOR
// ======================================

function generateQuestion() {

    const type =
        Math.floor(
            Math.random() * 5
        );

    let question;
    let answer;

    // ======================================
    // ADDITION
    // ======================================

    if (type === 0) {

        const a = rand(1, 50);
        const b = rand(1, 50);

        question =
            `${a} + ${b} = ?`;

        answer = a + b;

    }

    // ======================================
    // SUBTRACTION
    // ======================================

    else if (type === 1) {

        const a = rand(20, 100);
        const b = rand(1, 20);

        question =
            `${a} - ${b} = ?`;

        answer = a - b;

    }

    // ======================================
    // MULTIPLICATION
    // ======================================

    else if (type === 2) {

        const a = rand(1, 12);
        const b = rand(1, 12);

        question =
            `${a} × ${b} = ?`;

        answer = a * b;

    }

    // ======================================
    // DIVISION
    // ======================================

    else if (type === 3) {

        const b = rand(1, 10);
        const ans = rand(1, 10);

        const a = b * ans;

        question =
            `${a} ÷ ${b} = ?`;

        answer = ans;

    }

    // ======================================
    // MIXED
    // ======================================

    else {

        const a = rand(2, 10);
        const b = rand(2, 10);
        const c = rand(1, 5);

        question =
            `(${a} + ${b}) × ${c} = ?`;

        answer =
            (a + b) * c;

    }

    return {

        question,

        answer:
            answer.toString()

    };

}

// ======================================
// RANDOM NUMBER
// ======================================

function rand(min, max) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}

// ======================================
// HANDLE ANSWER
// ======================================

function handleAnswer(
    socket,
    room,
    user,
    message
) {

    const quiz =
        activeQuiz[room];

    if (!quiz)
        return;

    // prevent multiple winners
    if (quiz.answered)
        return;

    // ======================================
    // SAFE COMPARE
    // ======================================

    const userAnswer =
        String(message)
        .trim()
        .toLowerCase();

    const correctAnswer =
        String(quiz.answer)
        .trim()
        .toLowerCase();

    console.log(
`[ANSWER CHECK]
User: ${user}
Message: ${userAnswer}
Correct: ${correctAnswer}`
    );

    if (
        userAnswer !== correctAnswer
    ) {
        return;
    }

    // ======================================
    // WINNER
    // ======================================

    quiz.answered = true;

    const now =
        Date.now();

    const timeTaken =
        (now - quiz.startTime) / 1000;

    // ======================================
    // LOAD SCORES
    // ======================================

    let scores = loadJSON(
        "./storage/scores.json",
        {}
    );

    if (!scores[user]) {

        scores[user] = {

            score: 0,

            bestTime: null,

            correct: 0

        };

    }

    // ======================================
    // SCORE SYSTEM
    // ======================================

    const baseScore = 10;

    let bonus = 0;

    if (timeTaken < 3) {

        bonus = 5;

    } else if (timeTaken < 6) {

        bonus = 3;

    }

    const totalGain =
        baseScore + bonus;

    scores[user].score +=
        totalGain;

    scores[user].correct += 1;

    // ======================================
    // BEST TIME
    // ======================================

    if (

        !scores[user].bestTime ||

        timeTaken <
        scores[user].bestTime

    ) {

        scores[user].bestTime =
            timeTaken;

    }

    // ======================================
    // SAVE
    // ======================================

    saveJSON(
        "./storage/scores.json",
        scores
    );

    // ======================================
    // SEND RESULT
    // ======================================

    socket.send(JSON.stringify({

        handler: "room_message",

        type: "text",

        room,

        body:

`🏆 ${user} GOT THE CORRECT ANSWER!

✅ Correct:
${correctAnswer}

⚡ Speed:
${timeTaken.toFixed(2)}s

➕ Added Score:
+${totalGain}

🏆 Total Score:
${scores[user].score}

🎯 Correct Answers:
${scores[user].correct}

🔥 Best Speed:
${scores[user].bestTime.toFixed(2)}s`,

        id:
            "quizwin-" +
            Date.now()

    }));

    console.log(
`[QUIZ WINNER]
User: ${user}
Answer: ${correctAnswer}`
    );

    // ======================================
    // NEXT QUESTION
    // ======================================

    setTimeout(() => {

        sendQuestion(
            socket,
            room
        );

    }, 3000);

}

// ======================================

module.exports = {

    startQuiz,

    stopQuiz,

    handleAnswer

};
