const express = require("express");

const MainBot = require("./bots/mainBot");

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.post("/startbot", async(req, res) => {

    const username = req.body.username;
    const password = req.body.password;

    const result = await MainBot.start(
        username,
        password
    );

    res.json(result);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "Server running on port " + PORT
    );

});
