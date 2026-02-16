const audio = document.getElementById("audio");
const title = document.getElementById("title");
const cover = document.getElementById("cover");
const playlist = document.getElementById("playlist");
const categories = document.getElementById("categories");
const bg = document.getElementById("bg");
const qrcodeBox = document.getElementById("qrcode");

const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");

const progress = document.getElementById("progress");
const currentTimeText = document.getElementById("current");
const durationText = document.getElementById("duration");

let currentIndex = -1;
let songs = [...playlist.getElementsByTagName("li")];

let shuffleMode = false;
let repeatMode = false;

/* 建立分類 */
const catList = ["all", "slow songs", "fast songs", "female", "kids"];
const catNames = ["All 全部歌曲", "慢歌 Slow song", "快歌 Fast song", "女歌男唱 Female", "兒歌 Kids"];

categories.innerHTML = catList
    .map((c, i) => `<li data-cat="${c}">${catNames[i]}</li>`)
    .join("");

/* 播放歌曲 */
function playSong(index) {
    const item = songs[index];
    currentIndex = index;

    audio.src = item.getAttribute("data-src");
    cover.src = item.getAttribute("data-cover");
    title.textContent = item.textContent;

    bg.style.backgroundImage = `url(${item.getAttribute("data-cover")})`;

    /* 生成 QR Code */
    qrcodeBox.innerHTML = "";
    QRCode.toCanvas(qrcodeBox, window.location.href + "#" + item.textContent);

    audio.play();
    cover.style.animationPlayState = "running";
    playBtn.textContent = "⏸️";
}

/* 點擊播放清單 */
playlist.addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        playSong(songs.indexOf(e.target));
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
    if (shuffleMode) {
        playSong(Math.floor(Math.random() * songs.length));
    } else if (currentIndex < songs.length - 1) {
        playSong(currentIndex + 1);
    } else {
        playSong(0);
    }
});

/* 上一首 */
prevBtn.addEventListener("click", () => {
    if (shuffleMode) {
        playSong(Math.floor(Math.random() * songs.length));
    } else if (currentIndex > 0) {
        playSong(currentIndex - 1);
    } else {
        playSong(songs.length - 1);
    }
});

/* 自動播下一首 */
audio.addEventListener("ended", () => {
    if (repeatMode) {
        playSong(currentIndex);
    } else {
        nextBtn.click();
    }
});

/* 隨機播放 */
shuffleBtn.addEventListener("click", () => {
    shuffleMode = !shuffleMode;
    shuffleBtn.style.background = shuffleMode ? "#1ed760" : "#1DB954";
});

/* 單曲循環 */
repeatBtn.addEventListener("click", () => {
    repeatMode = !repeatMode;
    repeatBtn.style.background = repeatMode ? "#1ed760" : "#1DB954";
});

/* 分類功能 */
categories.addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        const cat = e.target.getAttribute("data-cat");

        songs.forEach(song => {
            song.style.display =
                cat === "all" || song.getAttribute("data-cat") === cat
                    ? "block"
                    : "none";
        });
    }
});

/* 播放進度條更新 */
audio.addEventListener("timeupdate", () => {
    const progressPercent = (audio.currentTime / audio.duration) * 100;
    progress.value = progressPercent;

    currentTimeText.textContent = formatTime(audio.currentTime);
    durationText.textContent = formatTime(audio.duration);
});

/* 拖動進度條 */
progress.addEventListener("input", () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
});

/* 時間格式 */
function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}