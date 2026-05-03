const express = require("express");
const path = require("path");

const app = express();

// serve static files
app.use(express.static(path.join(__dirname, "public")));

// fallback route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// PORT (Railway safe)
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("✅ A3R BOT RUNNING ON PORT " + PORT);
});
