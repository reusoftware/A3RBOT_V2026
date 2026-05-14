const MainBot = require("./bots/mainBot");

async function boot() {

    console.log("Starting MainBot...");

    const result = await MainBot.start(
        process.env.BOT_USERNAME,
        process.env.BOT_PASSWORD
    );

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        "Server running on port " + PORT
    );

});
