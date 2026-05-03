const express = require("express");
const app = express();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("✅ A3R BOT IS LIVE ON RAILWAY");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("A3R BOT RUNNING ON PORT " + PORT);
});
