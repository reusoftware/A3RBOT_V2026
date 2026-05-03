const express = require("express");
const cors = require("cors");

const bots = require("./bots");
const { rooms, initRoom } = require("./rooms");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/login", (req, res) => {
    const { botId } = req.body;
    bots[botId] = { children: [] };
    res.json({ ok: true });
});

app.post("/child", (req, res) => {
    const { parent, childId } = req.body;

    if (!bots[parent]) return res.json({ error: "No parent bot" });

    bots[parent].children.push(childId);
    bots[childId] = { parent };

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

app.post("/quiz/start", (req, res) => {
    const { room } = req.body;
    initRoom(room);

    rooms[room].quiz = {
        q: "5 + 5 = ?",
        a: "10"
    };

    res.json({ quiz: rooms[room].quiz });
});

app.post("/cricket/start", (req, res) => {
    const { room } = req.body;
    initRoom(room);

    rooms[room].cricket = {
        scoreA: 0,
        scoreB: 0
    };

    res.json({ cricket: rooms[room].cricket });
});

app.listen(3000, () => console.log("Server running on 3000"));