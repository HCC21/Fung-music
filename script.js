const audio = document.getElementById("audio");
const title = document.getElementById("title");
const cover = document.getElementById("cover");
const playlist = document.getElementById("playlist");
const categories = document.getElementById("categories");
const bg = document.getElementById("bg");
const recentList = document.getElementById("recent");
const searchInput = document.getElementById("search");

const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const progress = document.getElementById("progress");
const currentTimeText = document.getElementById("current");
const durationText = document.getElementById("duration");

const randomBtn = document.getElementById("random");
const repeatBtn = document.getElementById("repeat");
const favBtn = document.getElementById("fav");
const volumeSlider = document.getElementById("volume");
const eqBars = document.querySelectorAll(".eq-bar");

let songs = [...playlist.getElementsByTagName("li")];
let currentIndex = -1;

let isRandom = false;
let isRepeat = false;

let favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
let recent = JSON.parse(localStorage.getItem("recent") || "[]");
let playCount = JSON.parse(localStorage.getItem("playCount") || "{}");

/* 更新播放次數顯示（顯示在歌名前） */
function updatePlayCountDisplay() {
    songs.forEach(li => {
        const name = li.getAttribute("data-name") || li.textContent.trim();
        const count = playCount[name] || 0;
        li.innerHTML = `<span class="count">#${count}</span> ${name}`;
        li.setAttribute("data-name", name);
    });
}

/* 播放次數 +1 */
function increasePlayCount(name) {
    if (!playCount[name]) playCount[name] = 0;
    playCount[name]++;
    localStorage.setItem("playCount", JSON.stringify(playCount));
}

/* 高亮目前播放的歌曲 */
function highlightSong() {
    songs.forEach(li => li.classList.remove("playing"));
    if (currentIndex >= 0) songs[currentIndex].classList.add("playing");
}

/* 封面取色 → 自動背景 */
function extractColor(imgSrc) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgSrc;

    img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        const color = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
        bg.style.background = `radial-gradient(circle at top, ${color}, #000)`;
    };
}

/* 更新最近播放 */
function updateRecent(name) {
    recent = recent.filter(item => item !== name);
    recent.unshift(name);
    if (recent.length > 10) recent.pop();
    localStorage.setItem("recent", JSON.stringify(recent));
    renderRecent();
}

/* 渲染最近播放 */
function renderRecent() {
    recentList.innerHTML = "";
    recent.forEach(name => {
        const li = document.createElement("li");
        li.textContent = name;
        li.addEventListener("click", () => {
            const target = songs.find(s => s.getAttribute("data-name") === name);
            if (target) playSong(songs.indexOf(target));
        });
        recentList.appendChild(li);
    });
}

/* 播放歌曲 */
function playSong(index) {
    const item = songs[index];
    if (!item) return;

    currentIndex = index;

    const name = item.getAttribute("data-name") || item.textContent.trim();

    audio.src = item.getAttribute("data-src");
    cover.src = item.getAttribute("data-cover");
    title.textContent = name;

    extractColor(item.getAttribute("data-cover"));

    audio.play();
    cover.style.animationPlayState = "running";
    playBtn.textContent = "⏸️";

    highlightSong();
    updateFavIcon();

    increasePlayCount(name);
    updatePlayCountDisplay();

    updateRecent(name);
}

/* 隨機下一首 */
function getRandomIndex() {
    if (songs.length <= 1) return currentIndex;
    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * songs.length);
    } while (newIndex === currentIndex);
    return newIndex;
}

/* 點擊播放清單 */
playlist.addEventListener("click", e => {
    if (e.target.tagName === "LI" || e.target.parentElement.tagName === "LI") {
        const li = e.target.tagName === "LI" ? e.target : e.target.parentElement;
        playSong(songs.indexOf(li));
    }
});

/* 播放 / 暫停 */
playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        cover.style.animationPlayState = "running";
        playBtn.textContent = "⏸️";
    } else {
        audio.pause();
        cover.style.animationPlayState = "paused";
        playBtn.textContent = "▶️";
    }
});

/* 下一首 */
nextBtn.addEventListener("click", () => {
    if (isRandom) {
        playSong(getRandomIndex());
    } else {
        playSong((currentIndex + 1) % songs.length);
    }
});

/* 上一首 */
prevBtn.addEventListener("click", () => {
    if (isRandom) {
        playSong(getRandomIndex());
    } else {
        playSong((currentIndex - 1 + songs.length) % songs.length);
    }
});

/* 自動播下一首 / 單曲循環 */
audio.addEventListener("ended", () => {
    if (isRepeat) {
        audio.currentTime = 0;
        audio.play();
    } else {
        nextBtn.click();
    }
});

/* 分類 */
categories.addEventListener("click", e => {
    if (e.target.tagName === "LI") {
        const cat = e.target.getAttribute("data-cat");
        [...categories.children].forEach(li => li.classList.remove("active"));
        e.target.classList.add("active");

        songs.forEach(song => {
            const match = cat === "all" || song.getAttribute("data-cat") === cat;
            song.style.display = match ? "flex" : "none";
        });
    }
});

/* 搜尋 */
searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    songs.forEach(song => {
        const name = song.getAttribute("data-name") || song.textContent.trim();
        song.style.display = name.toLowerCase().includes(q) ? "flex" : "none";
    });
});

/* 進度條 + EQ */
audio.addEventListener("timeupdate", () => {
    if (!isNaN(audio.duration)) {
        progress.value = (audio.currentTime / audio.duration) * 100;
    }
    currentTimeText.textContent = formatTime(audio.currentTime);
    durationText.textContent = formatTime(audio.duration);
    animateEQ();
});

/* 拖動進度條 */
progress.addEventListener("input", () => {
    if (!isNaN(audio.duration)) {
        audio.currentTime = (progress.value / 100) * audio.duration;
    }
});

/* 音量 */
volumeSlider.addEventListener("input", () => {
    audio.volume = volumeSlider.value;
});

/* 隨機 */
randomBtn.addEventListener("click", () => {
    isRandom = !isRandom;
    randomBtn.classList.toggle("active");
});

/* 循環 */
repeatBtn.addEventListener("click", () => {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle("active");
});

/* 收藏 */
function updateFavIcon() {
    const name = title.textContent;
    favBtn.textContent = favorites.includes(name) ? "⭐" : "☆";
}

favBtn.addEventListener("click", () => {
    const name = title.textContent;
    if (!name || name === "選擇一首歌播放") return;

    if (favorites.includes(name)) {
        favorites = favorites.filter(f => f !== name);
    } else {
        favorites.push(name);
    }
    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateFavIcon();
});

/* EQ 動畫 */
function animateEQ() {
    if (audio.paused) {
        eqBars.forEach(bar => bar.style.height = "4px");
        return;
    }
    eqBars.forEach(bar => {
        bar.style.height = (4 + Math.random() * 18) + "px";
    });
}

/* 時間格式 */
function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

/* 初始化 */
audio.volume = 1;
updatePlayCountDisplay();
renderRecent();