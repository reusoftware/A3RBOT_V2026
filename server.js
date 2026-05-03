const express = require("express");
const app = express();

app.use(express.static("public")); // 👈 IMPORTANT

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/public/login.html");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("A3R BOT RUNNING ON PORT " + PORT);
});
