const express = require("express");
const app = express();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("✅ A3R BOT IS LIVE ON RAILWAY");
});

app.listen(PORT, "0.0.0.0", () => {
    console.log("RUNNING ON PORT " + PORT);
});
