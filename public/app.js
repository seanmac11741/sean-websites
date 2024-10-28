// Dark mode
const toggle = document.getElementById("toggle");
let modeText = document.querySelector(".mode-text");
const localDarkMode = localStorage.getItem("darkMode");
if (localDarkMode === "false") {
    light();
} else {
    dark();
}
toggle.addEventListener("click", toggleMode);
function toggleMode() {
    if (toggle.checked) {
        dark();
    } else {
        light();
    }
}

function dark() {
    toggle.checked = true;
    document.body.classList.add("dark-mode");
    modeText.innerText = "Dark";
    localStorage.setItem("darkMode", "true");
}

function light() {
    toggle.checked = false;
    document.body.classList.remove("dark-mode");
    localStorage.setItem("darkMode", "false");
    modeText.innerText = "Light";
}