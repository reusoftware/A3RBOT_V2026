const API = "https://your-backend-url.onrender.com";

let currentBot = "";

function log(msg) {
    document.getElementById("output").innerText += msg + "\n";
}

async function loginBot() {
    let botId = document.getElementById("botId").value;

    let res = await fetch(API + "/login", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ botId })
    });

    currentBot = botId;
    log("Logged in: " + botId);
}

async function createChild() {
    let childId = document.getElementById("childId").value;

    await fetch(API + "/child", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ parent: currentBot, childId })
    });

    log("Child bot created: " + childId);
}

async function toggleWelcome() {
    let room = document.getElementById("room").value;

    await fetch(API + "/welcome", {
        method: "POST",
        body: JSON.stringify({ room }),
        headers: {"Content-Type":"application/json"}
    });

    log("Welcome toggled: " + room);
}

async function startQuiz() {
    let room = document.getElementById("room").value;

    await fetch(API + "/quiz/start", {
        method: "POST",
        body: JSON.stringify({ room }),
        headers: {"Content-Type":"application/json"}
    });

    log("Quiz started in " + room);
}

async function startCricket() {
    let room = document.getElementById("room").value;

    await fetch(API + "/cricket/start", {
        method: "POST",
        body: JSON.stringify({ room }),
        headers: {"Content-Type":"application/json"}
    });

    log("Cricket started in " + room);
}

async function addMaster() {
    let room = document.getElementById("room").value;
    let user = document.getElementById("masterName").value;

    await fetch(API + "/master/add", {
        method: "POST",
        body: JSON.stringify({ room, user }),
        headers: {"Content-Type":"application/json"}
    });

    log("Master added: " + user);
}

async function removeMaster() {
    let room = document.getElementById("room").value;
    let user = document.getElementById("masterName").value;

    await fetch(API + "/master/remove", {
        method: "POST",
        body: JSON.stringify({ room, user }),
        headers: {"Content-Type":"application/json"}
    });

    log("Master removed: " + user);
}