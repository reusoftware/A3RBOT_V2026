const MainBot = require("./bots/mainBot");

async function boot() {

    console.log("Starting MainBot...");

    const result = await MainBot.start(
        process.env.BOT_USERNAME,
        process.env.BOT_PASSWORD
    );
