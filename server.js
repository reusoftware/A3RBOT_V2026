const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { users } = require("./users");
const bots = require("./bots");
const { rooms, initRoom } = require("./rooms");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public"));

// ================= LOGIN =================
app.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.json({ ok: false, message: "Invalid credentials" });
    }

    res.json({ ok: true, username: user.username, role: user.role });
});

// ================= BOT LOGIN =================
app.post("/bot/login", (req, res) => {
    const { botId, password } = req.body;

    if (!bots[botId] || bots[botId].password !== password) {
        bots[botId] = { password, children: [] };
    }

    res.json({ ok: true });
});

// ================= CHILD BOT =================
app.post("/child", (req, res) => {
    const { parent, childId } = req.body;

    if (!bots[parent]) return res.json({ error: "No parent bot" });

    bots[parent].children.push(childId);
    bots[childId] = { parent };

    res.json({ ok: true });
});

// ================= ROOM SYSTEM =================
app.post("/room/init", (req, res) => {
    const { room } = req.body;
    initRoom(room);
    res.json({ ok: true });
});

app.post("/welcome", (req, res) => {
    const { room } = req.body;
    initRoom(room);
    rooms[room].welcome = !rooms[room].welcome;
    res.json({ welcome: rooms[room].welcome });
});

app.post("/master/add", (req, res) => {
    const { room, user } = req.body;
    initRoom(room);
    rooms[room].masters.push(user);
    res.json({ ok: true });
});

app.post("/master/remove", (req, res) => {
    const { room, user } = req.body;
    initRoom(room);
    rooms[room].masters = rooms[room].masters.filter(u => u !== user);
    res.json({ ok: true });
});

// ================= GAMES =================
app.post("/quiz/start", (req, res) => {
    const { room } = req.body;
    initRoom(room);
    rooms[room].quiz = { q: "5 + 5 = ?", a: "10" };
    res.json({ quiz: rooms[room].quiz });
});

app.post("/cricket/start", (req, res) => {
    const { room } = req.body;
    initRoom(room);
    rooms[room].cricket = { scoreA: 0, scoreB: 0 };
    res.json({ cricket: rooms[room].cricket });
});

// ================= DASHBOARD =================
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});

app.get("/dashboard", (req, res) => {
    res.sendFile(__dirname + "/public/dashboard.html");
});

app.listen(process.env.PORT || 3000, () => {
    console.log("A3R BOT RUNNING");
});
