const loginBtn = document.getElementById("loginBtn");
const statusText = document.getElementById("status");
const logs = document.getElementById("logs");

loginBtn.addEventListener("click", async() => {

    const username = document
        .getElementById("username")
        .value;

    const password = document
        .getElementById("password")
        .value;

    statusText.innerHTML = "Connecting...";

    const response = await fetch(
        "/startbot",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        }
    );

    const result = await response.json();

    if (result.success) {

        statusText.innerHTML = "Online";

        logs.innerHTML +=
            "<p>Main Bot Connected</p>";

    } else {

        statusText.innerHTML = "Login Failed";

    }

});
