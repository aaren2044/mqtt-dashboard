function toggleDarkMode() {
    const body = document.body;
    const button = document.getElementById("darkModeToggle");

    // Toggle dark mode class on the body
    body.classList.toggle("dark-mode");

    // Change button text based on the mode
    if (body.classList.contains("dark-mode")) {
        button.textContent = "🌙 Light Mode";
    } else {
        button.textContent = "🌑 Dark Mode";
    }
}