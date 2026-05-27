/* ============================
   🎵 Supabase 初始化
============================ */
const SUPABASE_URL = "https://dzaemdhyvcgstidhvykn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YWVtZGh5dmNnc3RpZGh2eWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzgyMDMsImV4cCI6MjA4NzE1NDIwM30.Rx6vmN3QPnF4vxKIQt6Okid6SYmwrGfyCpom1KtaEo8";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================
   🚪 未登入 → 自動跳回 login.html
============================ */
const friendName = localStorage.getItem("friendName");
if (!friendName) {
  window.location.href = "login.html";
}

/* ============================
   🎵 DOM 元素
============================ */
const welcomeText = document.getElementById("welcome-text");
const welcomePopup = document.getElementById("welcome-popup");
const welcomePopupText = document.getElementById("welcome-popup-text");

const logoutBtn = document.getElementById("logout-btn");

const playlistButtons = document.getElementById("playlist-buttons");
const searchBox = document.getElementById("search");

const audio = document.getElementById("audio");
const title = document.getElementById("title");
const cover = document.getElementById("cover");
const progress = document.getElementById("progress");
const currentTimeText = document.getElementById("current");
const durationText = document.getElementById("duration");

const prevBtn = document.getElementById("prev");
const playBtn = document.getElementById("play");
const nextBtn = document.getElementById("next");

const adminPasswordInput = document.getElementById("admin-password");
const adminBtn = document.getElementById("admin-btn");
const adminPanel = document.getElementById("admin-panel");
const adminClose = document.getElementById("admin-close");
const adminNotice = document.getElementById("admin-notice");
if (friendName === "fungfung") {
  adminPasswordInput.style.display = "block";
  adminBtn.style.display = "block";
}

/* ============================
   🎉 歡迎彈窗
============================ */
function showWelcomePopup(name) {
  welcomePopupText.textContent = `🎉 歡迎你，${name}！`;
  welcomePopup.style.display = "flex";
  setTimeout(() => (welcomePopup.style.display = "none"), 2500);
}

welcomeText.textContent = `你好，${friendName}！`;
showWelcomePopup(friendName);

/* ============================
   ⭐ 儲存登入紀錄
============================ */
async function saveLoginHistory(name) {
  const { data: existing } = await supabase
    .from("login_history")
    .select("*")
    .eq("name", name)
    .single();

  const nowISO = new Date().toISOString();

  if (existing) {
    await supabase
      .from("login_history")
      .update({
        count: existing.count + 1,
        last_login: nowISO,
      })
      .eq("name", name);
  } else {
    await supabase.from("login_history").insert({
      name: name,
      count: 1,
      last_login: nowISO,
    });
  }
}

saveLoginHistory(friendName);

/* ============================
   ⭐ 顯示登入紀錄（sidebar）
============================ */
async function showLoginHistory(name) {
  const historyList = document.getElementById("login-history");

  let query = supabase.from("login_history").select("*");

  if (name !== "fungfung") {
    query = query.eq("name", name);
  }

  const { data: history } = await query
    .order("last_login", { ascending: false })
    .limit(5);

  historyList.innerHTML = "";

  if (!history || history.length === 0) {
    historyList.innerHTML = "<li>暫時沒有登入紀錄</li>";
    return;
  }

  history.forEach((friend) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${friend.name}</strong><br>
      <small>登入 ${friend.count} 次</small><br>
      <small>最後登入：${new Date(
        friend.last_login
      ).toLocaleString()}</small>
    `;
    historyList.appendChild(li);
  });
}

showLoginHistory(friendName);

/* ============================
   🔔 通知系統（管理員）
============================ */
async function checkNotifications() {
  if (friendName !== "fungfung") {
    adminNotice.style.display = "none";
    return;
  }

  const { data } = await supabase
    .from("comments")
    .select("id")
    .eq("isRead", false);

  adminNotice.style.display = data.length > 0 ? "block" : "none";
}

setInterval(checkNotifications, 5000);

/* ============================
   ⭐ 播放清單
============================ */
let currentIndex = -1;

function generatePlaylist(filterCat = "all", keyword = "") {
  playlistButtons.innerHTML = "";

  const currentUser = friendName.toLowerCase();

  songsData.forEach((song, realIndex) => {
    if (keyword && !song.name.toLowerCase().includes(keyword)) return;
    if (filterCat !== "all" && song.cat !== filterCat) return;

    if (song.allowedUsers && song.allowedUsers !== "all") {
      const allowed = song.allowedUsers.map((u) => u.toLowerCase());
      if (!allowed.includes(currentUser)) return;
    }

    const btn = document.createElement("button");
    btn.classList.add("playlist-item");
    btn.dataset.realIndex = realIndex;

    btn.innerHTML = `
      <img src="${song.cover}" class="playlist-cover">
      <span>${song.name}</span>
    `;

    const img = new Image();
    img.src = song.cover;
    img.onload = () => {
      const color = getDominantColor(img);
      btn.style.background = `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`;
      btn.style.borderColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.45)`;
    };

    btn.addEventListener("click", () => playSong(realIndex));

    playlistButtons.appendChild(btn);
  });
}

generatePlaylist();

/* ============================
   🔍 搜尋
============================ */
searchBox.addEventListener("input", () => {
  const keyword = searchBox.value.trim().toLowerCase();
  const selectedCat = document.getElementById("categories-select").value;
  generatePlaylist(selectedCat, keyword);
});

/* ============================
   ⭐ 分類
============================ */
document
  .getElementById("categories-select")
  .addEventListener("change", (e) => {
    const selectedCat = e.target.value;
    const keyword = searchBox.value.trim().toLowerCase();
    generatePlaylist(selectedCat, keyword);
  });

/* ============================
   🎵 播放歌曲
============================ */
let listenTimer = null;
let hasCounted = false;

function playSong(realIndex) {
  const song = songsData[realIndex];
  if (!song) return;

  currentIndex = realIndex;

  audio.src = song.src;
  cover.src = song.cover;
  title.textContent = song.name;

  audio.play();
  cover.style.animationPlayState = "running";
  playBtn.textContent = "⏸️";

  clearTimeout(listenTimer);
  hasCounted = false;

  listenTimer = setTimeout(() => {
    if (!hasCounted) {
      increasePlayCount(song.name);
      hasCounted = true;
    }
  }, 60000);

  highlightSong();
  loadComments(song.name, friendName);
}

async function increasePlayCount(songName) {
  const { data: existing } = await supabase
    .from("song_plays")
    .select("*")
    .eq("songName", songName)
    .single();

  if (existing) {
    await supabase
      .from("song_plays")
      .update({ count: existing.count + 1 })
      .eq("songName", songName);
  } else {
    await supabase.from("song_plays").insert({ songName, count: 1 });
  }
}

/* ============================
   ⭐ 播放中高亮
============================ */
function highlightSong() {
  const buttons = document.querySelectorAll(".playlist-item");
  buttons.forEach((btn) => btn.classList.remove("active"));

  buttons.forEach((btn) => {
    if (parseInt(btn.dataset.realIndex) === currentIndex) {
      btn.classList.add("active");
    }
  });
}

/* ============================
   🎵 播放器控制
============================ */
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

nextBtn.addEventListener("click", () => {
  playSong((currentIndex + 1) % songsData.length);
});

prevBtn.addEventListener("click", () => {
  playSong((currentIndex - 1 + songsData.length) % songsData.length);
});

/* ============================
   ⭐ 進度條
============================ */
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  progress.value = (audio.currentTime / audio.duration) * 100;
  currentTimeText.textContent = formatTime(audio.currentTime);
  durationText.textContent = formatTime(audio.duration);
});

audio.addEventListener("ended", () => {
  playSong((currentIndex + 1) % songsData.length);
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

/* ============================
   ⭐ 留言系統
============================ */
async function loadComments(songName, currentUser) {
  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("songName", songName)
    .order("id", { ascending: true });

  const list = document.getElementById("comment-list");
  list.innerHTML = "";

  if (!comments) return;

  comments.forEach((c) => {
    if (currentUser === "fungfung") {
      showComment(c, list);
      return;
    }

    if (!c.replyTo || c.replyTo === "") {
      if (c.user === currentUser) showComment(c, list);
      return;
    }

    if (c.replyTo === currentUser || c.user === currentUser) {
      showComment(c, list);
    }
  });
}

function showComment(c, list) {
  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${c.user}</strong>：${c.message}
    <br><small>${c.time}</small>
    <br><button class="reply-btn" data-user="${c.user}">回覆</button>
  `;
  list.appendChild(li);
}

document.getElementById("comment-submit").addEventListener("click", async () => {
  const input = document.getElementById("comment-input");
  const message = input.value.trim();
  if (!message) return;

  await supabase.from("comments").insert({
    songName: title.textContent,
    user: friendName,
    message,
    replyTo: input.dataset.replyTo || null,
    isRead: false,
    time: new Date().toLocaleString(),
  });

  input.value = "";
  input.dataset.replyTo = "";

  loadComments(title.textContent, friendName);
});

document.addEventListener("click", (e) => {
  if (e.target.classList.contains("reply-btn")) {
    const replyUser = e.target.dataset.user;
    const input = document.getElementById("comment-input");
    input.value = `@${replyUser} `;
    input.dataset.replyTo = replyUser;
    input.focus();
  }
});

/* ============================
   ⭐ 主題切換
============================ */
document
  .getElementById("theme-select")
  .addEventListener("change", (e) => {
    document.body.className = e.target.value;
  });

/* ============================
   ⭐ 登出
============================ */
logoutBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  localStorage.removeItem("friendName");

  window.location.href = "login.html";
});

/* ============================
   ⭐ 管理員後台
============================ */
adminBtn.addEventListener("click", async () => {
  const adminPass = adminPasswordInput.value.trim();

  if (adminPass === "790614") {
    adminPanel.style.display = "block";
    await loadAllLoginHistory();
    await loadAllUsers();
  } else {
    alert("管理員密碼錯誤！");
  }
});

adminClose.addEventListener("click", () => {
  adminPanel.style.display = "none";
});

/* ============================
   ⭐ 管理員：所有登入紀錄
============================ */
async function loadAllLoginHistory() {
  const list = document.getElementById("admin-login-history");

  const { data: history } = await supabase
    .from("login_history")
    .select("*")
    .order("last_login", { ascending: false });

  list.innerHTML = "";

  if (!history || history.length === 0) {
    list.innerHTML = "<li>沒有任何登入紀錄</li>";
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.name}</strong>
      <br>登入 ${item.count} 次
      <br>最後登入：${new Date(item.last_login).toLocaleString()}
    `;
    list.appendChild(li);
  });
}

/* ============================
   ⭐ 管理員：用戶管理
============================ */
async function loadAllUsers() {
  const list = document.getElementById("user-list");

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("id", { ascending: true });

  list.innerHTML = "";

  if (error) {
    list.innerHTML = "<li>讀取錯誤：" + error.message + "</li>";
    return;
  }

  data.forEach((user) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${user.name}</strong>
      ${user.name === "fungfung" ? "(管理員)" : ""}
      <div class="user-actions">
        <button onclick="resetPassword(${user.id})">重設密碼</button>
        <button onclick="deleteUser(${user.id})">刪除</button>
      </div>
    `;
    list.appendChild(li);
  });
}

document.getElementById("add-user-btn").addEventListener("click", async () => {
  const name = prompt("輸入新用戶名稱：");
  if (!name) return;

  const password = prompt("設定初始密碼：");
  if (!password) return;

  const { error } = await supabase.from("users").insert([
    { name: name.trim(), password: password.trim() },
  ]);

  if (error) {
    alert("新增失敗：" + error.message);
    return;
  }

  alert("新增成功！");
  loadAllUsers();
});

async function resetPassword(id) {
  const newPass = prompt("輸入新密碼：");
  if (!newPass) return;

  const { error } = await supabase
    .from("users")
    .update({ password: newPass })
    .eq("id", id);

  if (error) {
    alert("重設失敗：" + error.message);
    return;
  }

  alert("密碼已重設");
  loadAllUsers();
}

async function deleteUser(id) {
  if (!confirm("確定要刪除這個用戶嗎？")) return;

  const { error } = await supabase.from("users").delete().eq("id", id);

  if (error) {
    alert("刪除失敗：" + error.message);
    return;
  }

  alert("已刪除");
  loadAllUsers();
}

/* ============================
   ⭐ 小遊戲（下拉選單）
============================ */
document.getElementById("game-select").addEventListener("change", (e) => {
  const game = e.target.value;

  if (game === "sakura") {
    openGame();
    startSakuraGame();
  }

  if (game === "cartoon") {
    openGame();
    startCartoonGame();
  }
});

/* ============================
   ⭐ 遊戲 Modal
============================ */
function openGame() {
  document.getElementById("game-modal").style.display = "flex";
}

document.getElementById("game-close").addEventListener("click", () => {
  document.getElementById("game-modal").style.display = "none";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("game-ui").innerHTML = "";

  resetGameEvents();
});

/* ============================
   ⭐ 遊戲事件重置
============================ */
function resetGameEvents() {
  document.onmousemove = null;
  document.onkeydown = null;

  const canvas = document.getElementById("game-canvas");
  canvas.onclick = null;
  canvas.ontouchmove = null;
  canvas.ontouchstart = null;
}

/* ============================
   🌸 櫻花接花
============================ */
function startSakuraGame() {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 400;
  canvas.height = 400;

  let petals = [];
  let basketX = 160;
  let score = 0;
  let timeLeft = 30;
  let gameRunning = true;

  function createPetal() {
    petals.push({
      x: Math.random() * 380,
      y: -20,
      speed: 1 + Math.random() * 2,
    });
  }

  document.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    basketX = e.clientX - rect.left - 40;
  };

  canvas.ontouchmove = (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    basketX = touch.clientX - rect.left - 40;
  };

  function update() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, 400, 400);

    ctx.fillStyle = "#ff8fb3";
    ctx.fillRect(basketX, 350, 80, 20);

    ctx.fillStyle = "#ffcce0";
    petals.forEach((p, i) => {
      p.y += p.speed;

      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();

      if (p.y > 340 && p.x > basketX && p.x < basketX + 80) {
        score++;
        petals.splice(i, 1);
      }

      if (p.y > 400) {
        score--;
        petals.splice(i, 1);
      }
    });

    requestAnimationFrame(update);
  }

  sakuraPetalTimer = setInterval(createPetal, 500);

  sakuraTimer = setInterval(() => {
    timeLeft--;
    document.getElementById("game-ui").innerHTML =
      `分數：${score}｜剩餘時間：${timeLeft}s`;

    if (timeLeft <= 0) {
      gameRunning = false;
      clearInterval(sakuraTimer);
      clearInterval(sakuraPetalTimer);
      document.getElementById("game-ui").innerHTML =
        `🎉 遊戲結束！你的分數：${score}`;
    }
  }, 1000);

  update();
}

/* ============================
   🎨 卡通跳跳樂
============================ */
function startCartoonGame() {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 400;
  canvas.height = 400;

  let player = {
    x: 50,
    y: 300,
    width: 30,
    height: 30,
    dy: 0,
    jumping: false,
  };

  let obstacles = [];
  let score = 0;
  let gameRunning = true;

  document.onkeydown = (e) => {
    if (e.code === "Space" && !player.jumping) {
      player.dy = -10;
      player.jumping = true;
    }
  };

  canvas.ontouchstart = (e) => {
    e.preventDefault();
    if (!player.jumping) {
      player.dy = -10;
      player.jumping = true;
    }
  };

  function createObstacle() {
    obstacles.push({
      x: 400,
      y: 320,
      width: 30,
      height: 30,
      speed: 4,
    });
  }

  cartoonObstacleTimer = setInterval(() => {
    if (gameRunning) createObstacle();
  }, 1200);

  function update() {
    if (!gameRunning) return;

    ctx.clearRect(0, 0, 400, 400);

    ctx.fillStyle = "#fff1b8";
    ctx.fillRect(0, 0, 400, 400);

    ctx.fillStyle = "#ffd86b";
    ctx.fillRect(0, 350, 400, 50);

    ctx.fillStyle = "#ff9900";
    ctx.fillRect(player.x, player.y, player.width, player.height);

    player.y += player.dy;
    player.dy += 0.5;

    if (player.y >= 300) {
      player.y = 300;
      player.dy = 0;
      player.jumping = false;
    }

    ctx.fillStyle = "#ff4444";
    obstacles.forEach((o, i) => {
      o.x -= o.speed;
      ctx.fillRect(o.x, o.y, o.width, o.height);

      if (
        player.x < o.x + o.width &&
        player.x + player.width > o.x &&
        player.y < o.y + o.height &&
        player.y + player.height > o.y
      ) {
        gameRunning = false;
        clearInterval(cartoonObstacleTimer);
        document.getElementById("game-ui").innerHTML =
          `💥 Game Over！分數：${score}`;
      }

      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    });

    document.getElementById("game-ui").innerHTML = `分數：${score}`;

    requestAnimationFrame(update);
  }

  update();
}

/* ============================
   ⭐ 封面 dominant color
============================ */
function getDominantColor(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  let r = 0, g = 0, b = 0, count = 0;

  for (let i = 0; i < data.length; i += 20) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  return {
    r: Math.floor(r / count),
    g: Math.floor(g / count),
    b: Math.floor(b / count)
  };
}

/* ============================
   ⭐ Sidebar 自動橫向捲動
============================ */
function autoScrollSidebar() {
  const bar = document.querySelector(".sidebar");
  if (!bar) return;

  let scrollPos = 0;
  let autoScroll = true;   // ⭐ 是否自動捲動
  let timer = null;

  function startAutoScroll() {
    autoScroll = true;
  }

  function stopAutoScroll() {
    autoScroll = false;
    clearTimeout(timer);
    timer = setTimeout(startAutoScroll, 3000); // ⭐ 停 3 秒後再自動捲動
  }

  // ⭐ 手動捲動時暫停自動捲動
  bar.addEventListener("wheel", stopAutoScroll);
  bar.addEventListener("touchstart", stopAutoScroll);
  bar.addEventListener("touchmove", stopAutoScroll);
  bar.addEventListener("mousedown", stopAutoScroll);

  setInterval(() => {
    if (!autoScroll) return;

    scrollPos += 1;
    if (scrollPos >= bar.scrollWidth) {
      scrollPos = 0;
    }
    bar.scrollLeft = scrollPos;
  }, 50);
}

