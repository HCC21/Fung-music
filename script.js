const audio = document.getElementById("audio");
const title = document.getElementById("title");
const playlist = document.getElementById("playlist");

playlist.addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        const src = e.target.getAttribute("data-src");
        audio.src = src;
        title.textContent = e.target.textContent;
        audio.play();
    }
});