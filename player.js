const audio = document.getElementById("audio");
const title = document.getElementById("title");
const cover = document.getElementById("cover");
const progress = document.getElementById("progress");
const currentTimeText = document.getElementById("current");
const durationText = document.getElementById("duration");

const prevBtn = document.getElementById("prev");
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");
const randomBtn = document.getElementById("random");
const stopBtn = document.getElementById("stop");

const cd = document.querySelector(".cd");
const tonearm = document.getElementById("tonearm");

let listenTimer = null;
let hasCounted = false;

// ============================
// 播放歌曲
// ============================
function playFromPlaylist(index) {
  const buttons = document.querySelectorAll("#playlist-buttons .playlist-item");
  const btn = buttons[index];
  if (!btn) return;

  currentIndex = index;

  const rawSrc = btn.getAttribute("data-src");
  const songSrc = rawSrc.split("?")[0];
  const songName = btn.getAttribute("data-name");
  const songCover = btn.getAttribute("data-cover");

  audio.src = songSrc;
  cover.src = songCover;
  title.textContent = songName;

  audio.play();
  cover.style.animationPlayState = "running";
  cd.style.animationPlayState = "running";
  playBtn.textContent = "⏸️";
  tonearm.classList.add("playing");

  clearTimeout(listenTimer);
  hasCounted = false;
  listenTimer = setTimeout(() => {
    if (!hasCounted) {
      increasePlayCount(songSrc);
      hasCounted = true;
    }
  }, 60000);

  buttons.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  loadComments(songName, friendName, songSrc);
}

// ============================
// Stop
// ============================
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  cover.style.animationPlayState = "paused";
  cd.style.animationPlayState = "paused";
  tonearm.classList.remove("playing");
  playBtn.textContent = "▶️";

  title.textContent = "已停止播放";
});

// ============================
// 播放 / 暫停
// ============================
playBtn.addEventListener("click", () => {
  if (audio.paused) {
    tonearm.classList.remove("playing");
    cover.style.animationPlayState = "paused";
    cd.style.animationPlayState = "paused";

    setTimeout(() => {
      audio.play();
      cover.style.animationPlayState = "running";
      cd.style.animationPlayState = "running";
      playBtn.textContent = "⏸️";
      tonearm.classList.add("playing");
    }, 400);
  } else {
    audio.pause();
    cover.style.animationPlayState = "paused";
    cd.style.animationPlayState = "paused";
    playBtn.textContent = "▶️";
    tonearm.classList.remove("playing");
  }
});

// ============================
// 下一首 / 上一首 / 隨機
// ============================
nextBtn.addEventListener("click", () => {
  const buttons = document.querySelectorAll("#playlist-buttons .playlist-item");
  if (!buttons.length) return;

  tonearm.classList.remove("playing");
  cover.style.animationPlayState = "paused";
  cd.style.animationPlayState = "paused";

  setTimeout(() => {
    currentIndex = (currentIndex + 1 + buttons.length) % buttons.length;
    playFromPlaylist(currentIndex);
  }, 400);
});

prevBtn.addEventListener("click", () => {
  const buttons = document.querySelectorAll("#playlist-buttons .playlist-item");
  if (!buttons.length) return;

  tonearm.classList.remove("playing");
  cover.style.animationPlayState = "paused";
  cd.style.animationPlayState = "paused";

  setTimeout(() => {
    currentIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    playFromPlaylist(currentIndex);
  }, 400);
});

randomBtn.addEventListener("click", () => {
  const buttons = document.querySelectorAll("#playlist-buttons .playlist-item");
  if (!buttons.length) return;

  tonearm.classList.remove("playing");
  cover.style.animationPlayState = "paused";
  cd.style.animationPlayState = "paused";

  setTimeout(() => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * buttons.length);
    } while (buttons.length > 1 && newIndex === currentIndex);

    currentIndex = newIndex;
    playFromPlaylist(currentIndex);
  }, 400);
});

// ============================
// 進度條
// ============================
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  progress.value = (audio.currentTime / audio.duration) * 100;
  currentTimeText.textContent = formatTime(audio.currentTime);
  durationText.textContent = formatTime(audio.duration);
});

audio.addEventListener("ended", () => {
  const buttons = document.querySelectorAll("#playlist-buttons .playlist-item");
  if (!buttons.length) return;
  currentIndex = (currentIndex + 1 + buttons.length) % buttons.length;
  playFromPlaylist(currentIndex);
});

progress.addEventListener("input", () => {
  if (!audio.duration) return;
  audio.currentTime = (progress.value / 100) * audio.duration;
});

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
