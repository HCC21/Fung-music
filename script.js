/* ============================
   🎵 Supabase 初始化
============================ */
const SUPABASE_URL = "https://dzaemdhyvcgstidhvykn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YWVtZGh5dmNnc3RpZGh2eWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzgyMDMsImV4cCI6MjA4NzE1NDIwM30.Rx6vmN3QPnF4vxKIQt6Okid6SYmwrGfyCpom1KtaEo8";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================
   ⭐ 管理員設定
============================ */
const ADMIN_NAME = "fungfung";
const ADMIN_PASSWORD = "790614";

/* ============================
   🎵 DOM 元素
============================ */
const loginScreen = document.getElementById("login-screen");
const loginBtn = document.getElementById("login-btn");
const usernameInput = document.getElementById("username-input");
const passwordInput = document.getElementById("password-input");

const welcomeText = document.getElementById("welcome-text");
const welcomePopup = document.getElementById("welcome-popup");
const welcomePopupText = document.getElementById("welcome-popup-text");

const adminPasswordInput = document.getElementById("admin-password");
const adminBtn = document.getElementById("admin-btn");

const adminPanel = document.getElementById("admin-panel");
const adminClose = document.getElementById("admin-close");

const logoutBtn = document.getElementById("logout-btn");

const playlist = document.getElementById("playlist");
const categories = document.getElementById("categories");
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

const adminNotice = document.getElementById("admin-notice");

/* ============================
   🎉 登入提示
============================ */
function showWelcomePopup(name) {
  welcomePopupText.textContent = `🎉 歡迎你，${name}！`;
  welcomePopup.style.display = "flex";
  setTimeout(() => (welcomePopup.style.display = "none"), 2500);
}

/* ============================
   🎨 頭像顏色
============================ */
function generateAvatar(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

/* ============================
   ⭐ 儲存登入紀錄（已修正：使用 ISO 日期）
============================ */
async function saveLoginHistory(name) {
  const { data: existing } = await supabase
    .from("login_history")
    .select("*")
    .eq("name", name)
    .single();

  const nowISO = new Date().toISOString(); // ⭐ 正確排序格式

  if (existing) {
    await supabase
      .from("login_history")
      .update({
        count: existing.count + 1,
        last_login: nowISO
      })
      .eq("name", name);
  } else {
    await supabase.from("login_history").insert({
      name: name,
      count: 1,
      last_login: nowISO
    });
  }
}

/* ============================
   ⭐ 顯示登入紀錄（只顯示 5 個 + 依最近排序）
============================ */
async function showLoginHistory(name) {
  const historyList = document.getElementById("login-history");

  let query = supabase.from("login_history").select("*");

  if (name !== ADMIN_NAME) {
    query = query.eq("name", name);
  }

  const { data: history, error } = await query
    .order("last_login", { ascending: false }) // ⭐ 正確排序
    .limit(5);                                 // ⭐ 只顯示 5 個

  historyList.innerHTML = "";

  if (error || !history || history.length === 0) {
    historyList.innerHTML = "<li>暫時沒有登入紀錄</li>";
    return;
  }

  history.forEach(friend => {
    const li = document.createElement("li");

    const avatar = document.createElement("div");
    avatar.className = "friend-avatar";
    avatar.style.background = generateAvatar(friend.name);

    const text = document.createElement("div");
    text.innerHTML = `
      <strong>${friend.name}</strong><br>
      <small>登入 ${friend.count} 次</small><br>
      <small>最後登入：${new Date(friend.last_login).toLocaleString()}</small>
    `;

    li.appendChild(avatar);
    li.appendChild(text);
    historyList.appendChild(li);
  });
}

/* ============================
   🔔 通知系統（fungfung 未讀留言）
============================ */
async function checkNotifications() {
  const currentUser = (localStorage.getItem("friendName") || "")
    .trim()
    .toLowerCase();
  if (currentUser !== ADMIN_NAME) {
    adminNotice.style.display = "none";
    return;
  }

  const { data, error } = await supabase
    .from("comments")
    .select("id")
    .eq("isRead", false);

  if (error) return;

  adminNotice.style.display = data.length > 0 ? "block" : "none";
}
setInterval(checkNotifications, 5000);

async function markAllRead() {
  const currentUser = (localStorage.getItem("friendName") || "")
    .trim()
    .toLowerCase();
  if (currentUser !== ADMIN_NAME) return;

  await supabase
    .from("comments")
    .update({ isRead: true })
    .eq("isRead", false);

  adminNotice.style.display = "none";
}

/* ============================
   ⭐ 管理員：顯示全部登入紀錄（依最近排序）
============================ */
async function loadAdminHistory() {
  const list = document.getElementById("admin-history-list");

  const { data: history, error } = await supabase
    .from("login_history")
    .select("*")
    .order("last_login", { ascending: false });

  list.innerHTML = "";

  if (error || !history) return;

  history.forEach(friend => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${friend.name} — 登入 ${friend.count} 次（最後：${new Date(friend.last_login).toLocaleString()}）
    `;
    list.appendChild(li);
  });
}

/* ============================
   ⭐ 開啟管理員後台
============================ */
async function openAdminPanel() {
  adminPanel.style.display = "block";

  const list = document.getElementById("admin-user-list");
  list.innerHTML = "";

  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("name");

  if (!error && users) {
    users.forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.name} — 密碼：${u.password}`;
      list.appendChild(li);
    });
  }

  await loadAdminHistory();
  await markAllRead();
}

/* ============================
   ⭐ 回覆留言按鈕
============================ */
document.addEventListener("click", e => {
  if (e.target.classList.contains("reply-btn")) {
    const replyUser = e.target.dataset.user;

    const input = document.getElementById("comment-input");
    input.value = `@${replyUser} `;
    input.dataset.replyTo = replyUser;
    input.focus();
  }
});

/* ============================
   ⭐ 新增帳號
============================ */
document.getElementById("add-user-btn").addEventListener("click", async () => {
  const newName = document.getElementById("new-user-name").value.trim();
  const newPass = document.getElementById("new-user-pass").value.trim();

  if (!newName || !newPass) {
    alert("請輸入名字和密碼！");
    return;
  }

  if (newPass.length !== 3) {
    alert("密碼必須是 3 位數字！");
    return;
  }

  const { error } = await supabase
    .from("users")
    .insert({ name: newName, password: newPass });

  if (error) {
    alert("新增失敗，可能用戶已存在！");
    return;
  }

  alert(`成功新增：${newName}`);

  document.getElementById("new-user-name").value = "";
  document.getElementById("new-user-pass").value = "";

  openAdminPanel();
});

/* ============================
   ⭐ 登入按鈕
============================ */
loginBtn.addEventListener("click", async () => {
  const name = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("name", name)
    .eq("password", password)
    .single();

  if (error || !user) {
    alert("❌ 名字或密碼錯誤！");
    return;
  }

  localStorage.setItem("friendName", name);

  loginScreen.style.display = "none";
  welcomeText.textContent = `🎵 歡迎你，${name}`;

  if (name === ADMIN_NAME) {
    adminPasswordInput.style.display = "block";
    adminBtn.style.display = "block";
  }

  await saveLoginHistory(name);
  await showLoginHistory(name);
  await checkNotifications();

  if (name === ADMIN_NAME) {
    await loadAdminHistory();
  }

  generatePlaylist();
  showWelcomePopup(name);
});

/* ============================
   ⭐ 登出功能
============================ */
logoutBtn.addEventListener("click", () => {
  audio.pause();
  audio.currentTime = 0;

  localStorage.removeItem("friendName");

  adminPasswordInput.style.display = "none";
  adminBtn.style.display = "none";
  adminPanel.style.display = "none";

  loginScreen.style.display = "flex";
  welcomeText.textContent = "🎵 Fung Fung Music";

  document.getElementById("login-history").innerHTML = "";
  adminNotice.style.display = "none";
});

/* ============================
   🎵 生成 Playlist
============================ */
let currentIndex = -1;
let songs = [];

function generatePlaylist() {
  playlist.innerHTML = "";

  const currentUser = (localStorage.getItem("friendName") || "")
    .trim()
    .toLowerCase();

  songsData.forEach((song, index) => {
    if (song.allowedUsers && song.allowedUsers !== "all") {
      const allowed = song.allowedUsers.map(u => u.toLowerCase());
      if (!allowed.includes(currentUser)) {
        return;
      }
    }

    const li = document.createElement("li");
    li.textContent = song.name;
    li.dataset.src = song.src;
    li.dataset.cover = song.cover;
    li.dataset.cat = song.cat;
    li.dataset.index = index;

    playlist.appendChild(li);
  });

  songs = [...playlist.querySelectorAll("li")];
}
generatePlaylist();

/* ============================
   🔍 搜尋功能
============================ */
searchBox.addEventListener("input", () => {
  const keyword = searchBox.value.trim().toLowerCase();
  const currentUser = (localStorage.getItem("friendName") || "")
    .trim()
    .toLowerCase();

  playlist.innerHTML = "";

  songsData
    .filter(song => song.name.toLowerCase().includes(keyword))
    .forEach((song, index) => {
      if (song.allowedUsers && song.allowedUsers !== "all") {
        const allowed = song.allowedUsers.map(u => u.toLowerCase());
        if (!allowed.includes(currentUser)) {
          return;
        }
      }

      const li = document.createElement("li");
      li.textContent = song.name;
      li.dataset.src = song.src;
      li.dataset.cover = song.cover;
      li.dataset.cat = song.cat;
      li.dataset.index = index;

      playlist.appendChild(li);
    });

  songs = [...playlist.querySelectorAll("li")];
});

/* ============================
   ⭐ 分類功能
============================ */
categories.addEventListener("click", e => {
  if (e.target.tagName !== "LI") return;

  const selectedCat = e.target.dataset.cat;
  const currentUser = (localStorage.getItem("friendName") || "")
    .trim()
    .toLowerCase();

  playlist.innerHTML = "";

  songsData
    .filter(song => selectedCat === "all" || song.cat === selectedCat)
    .forEach((song, index) => {
      if (song.allowedUsers && song.allowedUsers !== "all") {
        const allowed = song.allowedUsers.map(u => u.toLowerCase());
        if (!allowed.includes(currentUser)) {
          return;
        }
      }

      const li = document.createElement("li");
      li.textContent = song.name;
      li.dataset.src = song.src;
      li.dataset.cover = song.cover;
      li.dataset.cat = song.cat;
      li.dataset.index = index;

      playlist.appendChild(li);
    });

  songs = [...playlist.querySelectorAll("li")];
});

/* ============================
   🎵 播放器功能
============================ */
function highlightSong() {
  songs.forEach(li => li.classList.remove("active"));
  if (songs[currentIndex]) songs[currentIndex].classList.add("active");
}

function playSong(index) {
  const item = songs[index];
  if (!item) return;

  currentIndex = index;

  audio.src = item.dataset.src;
  cover.src = item.dataset.cover;
  title.textContent = item.textContent;

  audio.play();
  cover.style.animationPlayState = "running";

  playBtn.textContent = "⏸️";
  playBtn.classList.add("playing");

  highlightSong();

  const currentUser = (localStorage.getItem("friendName") || "")
    .trim()
    .toLowerCase();

  if (currentUser === ADMIN_NAME) {
    markAllRead();
  }

  loadComments(item.textContent, currentUser);
}

playlist.addEventListener("click", e => {
  if (e.target.tagName === "LI") {
    playSong(parseInt(e.target.dataset.index, 10));
  }
});

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
  if (songs.length === 0) return;
  playSong((currentIndex + 1) % songs.length);
});

prevBtn.addEventListener("click", () => {
  if (songs.length === 0) return;
  playSong((currentIndex - 1 + songs.length) % songs.length);
});

/* ============================
   ⭐ 開啟 / 關閉 管理員後台
============================ */
adminBtn.addEventListener("click", () => {
  const adminPass = adminPasswordInput.value.trim();

  if (adminPass === ADMIN_PASSWORD) {
    openAdminPanel();
  } else {
    alert("管理員密碼錯誤！");
  }
});

adminClose.addEventListener("click", () => {
  adminPanel.style.display = "none";
});

/* ============================
   ⭐ 自動跳下一首 + 進度條
============================ */
audio.addEventListener("ended", () => {
  if (songs.length === 0) return;
  playSong((currentIndex + 1) % songs.length);
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  progress.value = (audio.currentTime / audio.duration) * 100;
  currentTimeText.textContent = formatTime(audio.currentTime);
  durationText.textContent = formatTime(audio.duration);
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
   ⭐ 留言系統：載入留言
============================ */
async function loadComments(songName, currentUser) {
  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("songName", songName)
    .order("id", { ascending: true });

  const list = document.getElementById("comment-list");
  list.innerHTML = "";

  if (error || !comments) return;

  comments.forEach(c => {
    if (currentUser === ADMIN_NAME) {
      showComment(c, list);
      return;
    }

    if (!c.replyTo || c.replyTo === "") {
      if (c.user === currentUser) {
        showComment(c, list);
      }
      return;
    }

       if (c.replyTo === currentUser || c.user === currentUser) {
      showComment(c, list);
    }
  });
}

/* ============================
   ⭐ 留言系統：顯示留言
============================ */
function showComment(c, list) {
  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${c.user}</strong>：${c.message}
    <br><small>${c.time}</small>
    <br><button class="reply-btn" data-id="${c.id}" data-user="${c.user}">回覆</button>
  `;
  list.appendChild(li);
}

/* ============================
   ⭐ 留言系統：送出留言
============================ */
document.getElementById("comment-submit").addEventListener("click", async () => {
  const input = document.getElementById("comment-input");
  const message = input.value.trim();
  if (!message) return;

  const currentUser = (localStorage.getItem("friendName") || "")
    .trim()
    .toLowerCase();
  const songName = title.textContent;

  await supabase.from("comments").insert({
    songName: songName,
    user: currentUser,
    message: message,
    replyTo: input.dataset.replyTo || null,
    isRead: false,
    time: new Date().toLocaleString()
  });

  input.value = "";
  input.dataset.replyTo = "";

  loadComments(songName, currentUser);
});

/* ============================
   ⭐ 主題切換
============================ */
document.getElementById("theme-select").addEventListener("change", e => {
  document.body.className = e.target.value;
});

/* ============================
   ⭐ 遊戲事件重置
============================ */
function resetGameEvents() {
  document.onmousemove = null;
  document.onkeydown = null;
  const canvas = document.getElementById("game-canvas");
  if (canvas) {
    canvas.onclick = null;
    canvas.ontouchmove = null;
    canvas.ontouchstart = null;
  }
}

/* ============================
   ⭐ 全局遊戲計時器
============================ */
let sakuraPetalTimer = null;
let sakuraTimer = null;
let techTimeout = null;
let cartoonObstacleTimer = null;

/* ============================
   ⭐ 打開 / 關閉 遊戲 modal
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

  if (sakuraPetalTimer) clearInterval(sakuraPetalTimer);
  if (sakuraTimer) clearInterval(sakuraTimer);
  if (techTimeout) clearTimeout(techTimeout);
  if (cartoonObstacleTimer) clearInterval(cartoonObstacleTimer);
});

/* ============================
   ⭐ 遊戲入口
============================ */
document.getElementById("game-sakura").addEventListener("click", () => {
  openGame();
  startSakuraGame();
});

document.getElementById("game-cartoon").addEventListener("click", () => {
  openGame();
  startCartoonGame();
});

/* ============================
   🌸 櫻花接花
============================ */
function startSakuraGame() {
  //（你原本的遊戲程式碼保持不變）
}

/* ============================
   🎨 卡通跳跳樂
============================ */
function startCartoonGame() {
  //（你原本的遊戲程式碼保持不變）
}
