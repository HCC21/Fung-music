/* ============================
   🎵 Supabase 初始化
============================ */
const SUPABASE_URL = "https://dzaemdhyvcgstidhvykn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YWVtZGh5dmNnc3RpZGh2eWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzgyMDMsImV4cCI6MjA4NzE1NDIwM30.Rx6vmN3QPnF4vxKIQt6Okid6SYmwrGfyCpom1KtaEo8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

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

const playlistContainer = document.getElementById("playlist-buttons");
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
const randomBtn = document.getElementById("random");
const stopBtn = document.getElementById("stop");

const adminPasswordInput = document.getElementById("admin-password");
const adminBtn = document.getElementById("admin-btn");
const adminPanel = document.getElementById("admin-panel");
const adminClose = document.getElementById("admin-close");

const cd = document.querySelector(".cd");
const tonearm = document.getElementById("tonearm");

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
   ⭐ 限制「man / manman」分類只有 fungfung & manman 可見
============================ */
window.addEventListener("load", () => {
  const currentUser = friendName.toLowerCase();

  // 要隱藏的分類
  const restrictedCats = ["man", "manman"];

  restrictedCats.forEach(cat => {
    const option = document.querySelector(`option[value="${cat}"]`);
    if (currentUser !== "fungfung" && currentUser !== "manman") {
      if (option) option.remove();
    }
  });
});
let listenTimer = null;
let hasCounted = false;

/* ============================
   ⭐ 儲存登入紀錄
============================ */
async function saveLoginHistory(name) {
  const { data: existing } = await supabaseClient
    .from("login_history")
    .select("*")
    .eq("name", name)
    .single();

  const nowISO = new Date().toISOString();

  if (existing) {
    await supabaseClient
      .from("login_history")
      .update({
        count: existing.count + 1,
        last_login: nowISO,
      })
      .eq("name", name);
  } else {
    await supabaseClient.from("login_history").insert({
      name: name,
      count: 1,
      last_login: nowISO,
    });
  }
}

saveLoginHistory(friendName);


/* ============================
   ⭐ 播放清單（以歌單為唯一來源）
============================ */
function generatePlaylist(filterCat = "all", keyword = "") {
  playlistContainer.innerHTML = "";

  const currentUser = friendName.toLowerCase();
  let displayIndex = -1;

  songsData.forEach((song) => {

    // ⭐ 1. man 權限（最重要）
    if (song.cat === "man" && currentUser !== "fungfung" && currentUser !== "manman") {
      return;
    }

    // ⭐ 2. allowedUsers（如果你以後想用）
    if (Array.isArray(song.allowedUsers)) {
      const allowed = song.allowedUsers.map(u => u.toLowerCase());
      if (!allowed.includes(currentUser)) return;
    }

    // ⭐ 3. 搜尋過濾
    if (keyword && !song.name.toLowerCase().includes(keyword)) return;

    // ⭐ 4. 分類過濾
    if (filterCat !== "all" && song.cat !== filterCat) return;

    // ⭐ 5. 顯示歌曲
    displayIndex++;
    const thisIndex = displayIndex;

    const btn = document.createElement("button");
    btn.classList.add("playlist-item");

    btn.setAttribute("data-src", song.src);
    btn.setAttribute("data-name", song.name);
    btn.setAttribute("data-cover", song.cover);

btn.innerHTML = `
  <img src="${song.cover}" class="playlist-cover">
  <span>${song.name}</span>
  <div class="play-count">0</div>
`;

// ⭐ 載入 Supabase 播放次數
getPlayCount(song.src).then(count => {
  btn.querySelector(".play-count").textContent = `${count} `;
});

    const img = new Image();
    img.src = song.cover;
    img.onload = () => {
      const color = getDominantColor(img);
      btn.style.background = `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`;
      btn.style.borderColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.45)`;
    };

btn.addEventListener("click", async () => {
  currentIndex = thisIndex;
  playFromPlaylist(thisIndex);

  const newCount = await getPlayCount(song.src);
  btn.querySelector(".play-count").textContent = `${newCount}`;
});
    playlistContainer.appendChild(btn);
  });
}
async function increasePlayCount(src) {
  // ⭐ 先查詢是否已有紀錄
  const { data, error } = await supabaseClient
    .from("song_stats")
    .select("count")
    .eq("src", src)
    .maybeSingle();   // ⭐ 不會報錯（比 single() 更安全）

  if (error) {
    console.error("查詢錯誤：", error);
    return;
  }

  if (!data) {
    // ⭐ 第一次播放 → 建立紀錄
    const { error: insertError } = await supabaseClient
      .from("song_stats")
      .insert([{ src: src, count: 1 }]);

    if (insertError) console.error("新增錯誤：", insertError);
  } else {
    // ⭐ 已存在 → count + 1
    const { error: updateError } = await supabaseClient
      .from("song_stats")
      .update({ count: data.count + 1 })
      .eq("src", src);

    if (updateError) console.error("更新錯誤：", updateError);
  }
}
async function getPlayCount(src) {
  const { data, error } = await supabaseClient
    .from("song_stats")
    .select("count")
    .eq("src", src)
    .maybeSingle();

  if (error || !data) return 0;
  return data.count;
}


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
   🎵 播放歌曲（從歌單）
============================ */
function playFromPlaylist(index) {
  const buttons = document.querySelectorAll("#playlist-buttons .playlist-item");
  const btn = buttons[index];
  if (!btn) return;

  currentIndex = index;

  const rawSrc = btn.getAttribute("data-src");
  const songSrc = rawSrc.split("?")[0];   // ⭐ 去除 ? 後面的參數
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

 // ⭐⭐⭐ 正確：在這裡記錄聽歌
  recordPlayHistory(songName, songSrc, friendName);

  // ⭐ 播放 60 秒後才計數（避免 double count）
  clearTimeout(listenTimer);
  hasCounted = false;
  listenTimer = setTimeout(() => {
    if (!hasCounted && typeof increasePlayCount === "function") {
      increasePlayCount(songSrc);
      hasCounted = true;
    }
  }, 60000);

  // ⭐ UI 標記目前播放中
  buttons.forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  // ⭐ 正確載入留言（最重要）
  loadComments(songName, friendName, songSrc);
}

/* ============================
   🎧 Stop Key
============================ */
stopBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  cover.style.animationPlayState = "paused";
  cd.style.animationPlayState = "paused";
  tonearm.classList.remove("playing");
  playBtn.textContent = "▶️";

  title.textContent = "已停止播放";
});

/* ============================
   ▶️ 播放 / 暫停
============================ */
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

/* ============================
   ⏭️ 下一首
============================ */
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

/* ============================
   ⏮️ 上一首
============================ */
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

/* ============================
   🔀 Random
============================ */
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

/* ============================
   ⭐ 完整留言系統（最終版）
============================ */
async function loadComments(songName, currentUser) {

  const { data: comments, error } = await supabaseClient
    .from("comments")
    .select("*")
    .eq("songName", songName)
    .order("id", { ascending: true });

  const list = document.getElementById("comment-list");
  list.innerHTML = "";

  if (error || !comments) {
    console.log("讀取留言錯誤：", error);
    return;
  }

  let replyMessage = null; // ⭐ 記錄是否有人回覆你

  comments.forEach((c) => {
    // ⭐ 管理員看到全部留言
    if (currentUser === "fungfung") {
      showComment(c, list);
    } else {
      // ⭐ 普通用戶：只看到自己相關的留言
      if (!c.replyTo) {
        if (c.user === currentUser) showComment(c, list);
      } else {
        if (c.replyTo === currentUser || c.user === currentUser) {
          showComment(c, list);
        }
      }
    }

    // ⭐ 回覆通知
    if (c.replyTo === currentUser) {
      replyMessage = `${c.user} 回覆了你：${c.message}`;
    }
  });

  // ⭐ 顯示回覆通知
  const notice = document.getElementById("reply-notice");
  notice.textContent = replyMessage ? replyMessage : "";

  // ⭐ 管理員標記已讀
  if (currentUser === "fungfung") {
    await supabaseClient
      .from("comments")
      .update({ isRead: true })
      .eq("songName", songName);
  }
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

  // ⭐ 正確寫入 Supabase（用 songName）
  const { error } = await supabaseClient.from("comments").insert({
    songName: title.textContent,
    user: friendName,
    message,
    replyTo: input.dataset.replyTo || null,
    isRead: false,
    time: new Date().toLocaleString(),
  });

  if (error) {
    alert("留言寫入失敗：" + error.message);
    console.log(error);
    return;
  }

  input.value = "";
  input.dataset.replyTo = "";

  // ⭐ 重新載入留言
  loadComments(title.textContent, friendName);

  // ⭐ 顯示提示文字
  const hint = document.getElementById("comment-hint");
  hint.textContent = `「${title.textContent}」已有留言：${message}`;
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
   ⭐ 送出留言
============================ */
document.getElementById("comment-submit").addEventListener("click", async () => {
  const input = document.getElementById("comment-input");
  const message = input.value.trim();
  if (!message) return;

  // ⭐ 正確寫入 Supabase（用 songName）
  const { error } = await supabaseClient.from("comments").insert({
    songName: title.textContent,          // ⭐ 修正：用 songName
    user: friendName,
    message,
    replyTo: input.dataset.replyTo || null,
    isRead: false,
    time: new Date().toLocaleString(),
  });

  if (error) {
    alert("留言寫入失敗：" + error.message);
    console.log(error);
    return;
  }

  input.value = "";
  input.dataset.replyTo = "";

  // ⭐ 重新載入留言
  loadComments(title.textContent, friendName);

  // ⭐ 顯示提示文字
  const hint = document.getElementById("comment-hint");
  hint.textContent = `「${title.textContent}」已有留言：${message}`;
});

/* ============================
   ⭐ 回覆功能
============================ */
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

  const { data: history } = await supabaseClient
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

  const { data, error } = await supabaseClient
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
        <button onclick="resetPassword('${user.id}')">重設密碼</button>
        <button onclick="deleteUser('${user.id}')">刪除</button>
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

  const { error } = await supabaseClient.from("users").insert([
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

  const { error } = await supabaseClient
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

  const { error } = await supabaseClient
    .from("users")
    .delete()
    .eq("id", id);

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
let sakuraPetalTimer = null;
let sakuraTimer = null;

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
let cartoonObstacleTimer = null;

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

  let r = 0,
    g = 0,
    b = 0,
    count = 0;

  for (let i = 0; i < data.length; i += 20) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }

  return {
    r: Math.floor(r / count),
    g: Math.floor(g / count),
    b: Math.floor(b / count),
  };
}

/* ============================
   ⭐ Sidebar 自動橫向捲動
============================ */
function autoScrollSidebar() {
  const bar = document.querySelector(".sidebar");
  if (!bar) return;

  let autoScroll = true;
  let direction = 1;

  bar.addEventListener("click", () => {
    autoScroll = false;
  });

  setInterval(() => {
    if (!autoScroll) return;

    bar.scrollLeft += direction;

    if (bar.scrollLeft + bar.clientWidth >= bar.scrollWidth) {
      direction = -1;
    }

    if (bar.scrollLeft <= 0) {
      direction = 1;
    }
  }, 30);
}

/* ============================
   ⭐ 載入時啟動
============================ */
window.addEventListener("load", () => {
  autoScrollSidebar();
  generatePlaylist("all", "");
});
// ⭐ 記錄播放紀錄
async function recordPlayHistory(songName, songSrc, user) {
  console.log("🎧 記錄播放：", songName, songSrc, user);

  const { error } = await supabaseClient.from("play_history").insert({
    username: user,
    songname: songName,
    songsrc: songSrc,
    time: new Date().toLocaleString(),
  });

  if (error) {
    console.log("❌ 記錄聽歌失敗：", error);
  } else {
    console.log("✅ 播放紀錄已寫入");

    // ⭐ 如果後台開緊，就即時刷新播放紀錄列表
    const panel = document.getElementById("admin-panel");
    if (panel && panel.style.display === "block") {
      loadPlayHistory();
    }
  }
}

// ⭐ 後台讀取播放紀錄
async function loadPlayHistory() {
  const { data, error } = await supabaseClient
    .from("play_history")
    .select("*")
    .order("id", { ascending: false });

  const list = document.getElementById("history-list");
  list.innerHTML = "";

  if (error || !data) {
    list.innerHTML = "<li>讀取錯誤</li>";
    console.log("❌ 播放紀錄讀取錯誤：", error);
    return;
  }

  if (data.length === 0) {
    list.innerHTML = "<li>暫時沒有播放紀錄</li>";
    return;
  }

  data.forEach(h => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${h.username}</strong> 聽了 <strong>${h.songname}</strong>
      <br><small>${h.time}</small>
    `;
    list.appendChild(li);
  });
}

// ⭐ 播放歌曲（你現有版本，只加咗註解）
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

  // ⭐ 播放時記錄
  recordPlayHistory(songName, songSrc, friendName);

  clearTimeout(listenTimer);
  hasCounted = false;
  listenTimer = setTimeout(() => {
    if (!hasCounted && typeof increasePlayCount === "function") {
      increasePlayCount(songSrc);
      hasCounted = true;
    }
  }, 60000);

  buttons.forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");

  loadComments(songName, friendName, songSrc);
}

document.getElementById("admin-open").addEventListener("click", () => {
  document.getElementById("admin-panel").style.display = "block";

  // ⭐ 第一次讀取（立即）
  loadPlayHistory();

  // ⭐ 第二次讀取（0.3 秒後，確保最新）
  setTimeout(() => {
    loadPlayHistory();
  }, 300);

  loadAllLoginHistory();
  loadAllUsers();
});
