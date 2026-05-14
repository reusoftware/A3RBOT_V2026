
const {
    loadJSON,
    saveJSON
} = require("./storage");

const activeQuiz = {};

const questions = [
    {
        q: "4*(1+2)*7+5",
        a: "89"
    },
    {
        q: "(8-1)-8",
        a: "-1"
    },
    {
        q: "4-(2*2*7)+2",
        a: "-22"
    }
];

function generatePacketID() {
    return "BOT-" + Date.now();
}

function startQuiz(socket, room) {

    setInterval(() => {

        const random = questions[
            Math.floor(
                Math.random() * questions.length
            )
        ];

        activeQuiz[room] = {
            answer: random.a,
            startTime: Date.now()
        };

        sendRoomMessage(
            socket,
            room,
            `Quiz: ${random.q} = ?`
        );

    }, 60000);

}

function handleAnswer(
    socket,
    room,
    user,
    message
) {

    const quiz = activeQuiz[room];

    if (!quiz) return;

    if (
        message === quiz.answer
    ) {

        const speed = (
            (Date.now() - quiz.startTime)
            / 1000
        ).toFixed(2);

        const scores = loadJSON(
            "./storage/scores.json",
            {}
        );

        if (!scores[user]) {

            scores[user] = {
                score: 0
            };

        }

        scores[user].score += 5;

        saveJSON(
            "./storage/scores.json",
            scores
        );

        sendRoomMessage(
            socket,
            room,
            `${user} answered correctly! Speed: ${speed}s Total Score: ${scores[user].score}`
        );

        delete activeQuiz[room];

    }

}

function sendRoomMessage(
    socket,
    room,
    body
) {

    socket.send(JSON.stringify({
        handler: "room_message",
        type: "text",
        room,
        body,
        url: "",
        length: "0",
        id: generatePacketID()
    }));

}

module.exports = {
    startQuiz,
    handleAnswer
};
