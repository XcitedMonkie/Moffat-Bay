
// Get the login form and message area
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

// Run this code when someone clicks Login
loginForm.addEventListener("submit", async function(event) {

    // Prevent the page from refreshing
    event.preventDefault();

    // Get the email and password entered
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Checking your login...";

    try {
        // Send login information to the Java server
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        if (response.ok) {
            loginMessage.textContent = "Login successful!";
        } else if (response.status === 401) {
            loginMessage.textContent = "Invalid email or password.";
        } else {
            loginMessage.textContent = "Unable to log in. Please try again.";
        }

    } catch (error) {
        loginMessage.textContent = "Could not connect to the server.";
    }
});
