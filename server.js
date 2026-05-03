const express = require("express");
const app = express();

const PORT = process.env.PORT;

app.get("/", (req, res) => {
    res.send("✅ A3R BOT IS LIVE ON RAILWAY");
});

const PORT = process.env.PORT;

if (!PORT) {
    console.error("PORT not provided by Railway!");
    process.exit(1);
}

app.listen(PORT, () => {
    console.log("A3R BOT RUNNING ON PORT " + PORT);
});
