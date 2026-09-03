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
let isRandomMode = localStorage.getItem("isRandomMode") === "true";
const repeatOneBtn = document.getElementById("repeat-one");
let isRepeatOne = localStorage.getItem("isRepeatOne") === "true";
function updateRepeatButton() {
  if (!repeatOneBtn) return;
  repeatOneBtn.classList.toggle("active-mode", isRepeatOne);
  repeatOneBtn.setAttribute("aria-pressed", String(isRepeatOne));
  repeatOneBtn.title = isRepeatOne ? "單曲循環：已開啟" : "單曲循環：已關閉";
}
repeatOneBtn?.addEventListener("click", () => {
  isRepeatOne = !isRepeatOne;
  localStorage.setItem("isRepeatOne", String(isRepeatOne));
  updateRepeatButton();
});
updateRepeatButton();

function updateRandomButton() {
  if (!randomBtn) return;
  randomBtn.classList.toggle("active-mode", isRandomMode);
  randomBtn.setAttribute("aria-pressed", String(isRandomMode));
  randomBtn.title = isRandomMode ? "隨機播放：已開啟" : "隨機播放：已關閉";
}

// Random 只切換模式，不會在按下時立即跳到另一首歌。
if (randomBtn) {
  randomBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    isRandomMode = !isRandomMode;
    localStorage.setItem("isRandomMode", String(isRandomMode));
    updateRandomButton();
  });
}

window.addEventListener("load", updateRandomButton);
updateRandomButton();
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
    // 檢查主頁面分類選單與上傳頁面分類選單
    const options = document.querySelectorAll(`option[value="${cat}"]`);
    if (currentUser !== "fungfung" && currentUser !== "manman") {
      options.forEach(opt => opt.remove());
    }
  });
});
let listenTimer = null;
let hasCounted = false;
let activePlaybackSequence = null;

function getPlaybackButtons() {
  const buttons = [...document.querySelectorAll("#playlist-buttons .playlist-item")];
  if (!activePlaybackSequence) return buttons;
  return activePlaybackSequence
    .map(src => buttons.find(button => button.dataset.src === src))
    .filter(Boolean);
}

function getNextPlaybackIndex(buttons) {
  if (!buttons.length) return -1;
  if (!isRandomMode) return (currentIndex + 1 + buttons.length) % buttons.length;

  let nextIndex = currentIndex;
  if (buttons.length > 1) {
    while (nextIndex === currentIndex) {
      nextIndex = Math.floor(Math.random() * buttons.length);
    }
  }
  return nextIndex;
}


/* ============================
   ⭐ 儲存登入紀錄
============================ */
async function saveLoginHistory(name) {
  if (!name) return;
  const searchName = name.trim().toLowerCase();
  
  // 先嘗試查詢
  const { data: existing, error } = await supabaseClient
    .from("login_history")
    .select("*")
    .ilike("name", searchName)
    .maybeSingle();

  const nowISO = new Date().toISOString();

  if (existing) {
    // 累計次數
    await supabaseClient
      .from("login_history")
      .update({
        count: (existing.count || 0) + 1,
        last_login: nowISO,
      })
      .eq("id", existing.id);
  } else {
    // 新增紀錄
    await supabaseClient.from("login_history").insert({
      name: name,
      count: 1,
      last_login: nowISO,
    });
  }
}

// 確保在頁面加載後只執行一次
if (friendName) {
  saveLoginHistory(friendName);
}

/* ============================
   ⭐ 從 Supabase 讀取動態歌曲
============================ */
async function fetchDynamicSongs() {
  try {
    const { data: dbSongs, error } = await supabaseClient
      .from("songs")
      .select("*");
    
    if (error) throw error;
    
    if (dbSongs && dbSongs.length > 0) {
      const currentUser = friendName.toLowerCase();
      // 將資料庫中的歌曲合併到現有的 songsData 中（避免重複）
      dbSongs.forEach(dbSong => {
        // ⭐ 安全檢查：如果歌曲屬於 man 或 manman 分類，且用戶不是授權用戶，則跳過
        const restrictedCats = ["man", "manman"];
        if (restrictedCats.includes(dbSong.cat) && currentUser !== "fungfung" && currentUser !== "manman") {
          return;
        }

        const exists = songsData.some(s => s.src === dbSong.src);
        if (!exists) {
          songsData.push({
            name: dbSong.name,
            src: dbSong.src,
            cover: dbSong.cover,
            cat: dbSong.cat
          });
        }
      });
    }
  } catch (err) {
    console.warn("無法讀取動態歌曲列表：", err.message);
  }
}

// 初始化時讀取一次
fetchDynamicSongs().then(() => generatePlaylist());


/* ============================
   ⭐ 播放清單（以歌單為唯一來源）
============================ */
function generatePlaylist(filterCat = "all", keyword = "") {
  playlistContainer.innerHTML = "";
  
  // 處理自訂歌單顯示
  const myPlaylistSection = document.getElementById("my-playlist-section");
  if (filterCat === "my-playlist") {
    myPlaylistSection.style.display = "block";
    renderMyPlaylist();
  } else {
    myPlaylistSection.style.display = "none";
  }

  const currentUser = friendName.toLowerCase();
  let displayIndex = -1;
  // 自定歌單模式仍顯示全部歌曲，讓使用者可以按「＋」加入目前歌單；
  // 但播放次序獨立使用目前歌單的儲存次序。
  activePlaybackSequence = filterCat === "my-playlist"
    ? getActivePlaylist().songs.slice()
    : null;
  const songsToDisplay = songsData;

  songsToDisplay.forEach((song) => {

    // ⭐ 1. 私人分類權限：其他用戶不可看到 man／manman 歌曲
    if ((song.cat === "man" || song.cat === "manman") && currentUser !== "fungfung" && currentUser !== "manman") {
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
    if (filterCat !== "all" && filterCat !== "my-playlist" && song.cat !== filterCat) return;

    // ⭐ 5. 顯示歌曲
    displayIndex++;
    const thisIndex = activePlaybackSequence
      ? activePlaybackSequence.indexOf(song.src)
      : displayIndex;

  const btn = document.createElement("button");
btn.classList.add("playlist-item");

    btn.setAttribute("data-src", song.src);
    btn.setAttribute("data-name", song.name);
    btn.setAttribute("data-cover", song.cover);

btn.innerHTML = `
  <img src="${song.cover}" class="playlist-cover">
  <span>${song.name}</span>

  <span class="add-to-my-btn" title="加入目前歌單" data-src="${song.src}" role="button" aria-label="加入目前歌單">➕</span>

  <div class="info-box">
    <span class="like-icon" data-src="${song.src}">👍</span>
    <span class="like-count" id="like-${song.src}">0</span>

    <span class="play-icon">▶️</span>
    <span class="play-count" id="play-${song.src}">0</span>
  </div>
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

btn.addEventListener("click", async (e) => {

  // ⭐ Like 或右上角「＋」不是播放操作
  if (e.target.closest(".like-icon") || e.target.closest(".add-to-my-btn")) {
    return;
  }

  const playbackButtons = getPlaybackButtons();
  const playbackIndex = playbackButtons.findIndex(button => button.dataset.src === song.src);
  if (playbackIndex < 0) return;
  currentIndex = playbackIndex;
  playFromPlaylist(playbackIndex);

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
  const buttons = getPlaybackButtons();
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
  setCurrentSongForGifts(songSrc);

  audio.play();
  cover.style.animationPlayState = "running";
  cd.style.animationPlayState = "running";
  playBtn.textContent = "⏸️";
  tonearm.classList.add("playing");

 // ⭐⭐⭐ 正確：在這裡記錄聽歌
  recordPlayHistory(songName, songSrc, friendName);
  notifySongEventRecipients("listen", songSrc, `${friendName} 開始聽歌`);

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
  const buttons = getPlaybackButtons();
  if (!buttons.length) return;

  tonearm.classList.remove("playing");
  cover.style.animationPlayState = "paused";
  cd.style.animationPlayState = "paused";

  setTimeout(() => {
    const nextIndex = getNextPlaybackIndex(buttons);
    if (nextIndex < 0) return;
    currentIndex = nextIndex;
    playFromPlaylist(currentIndex);
  }, 400);
});

/* ============================
   ⏮️ 上一首
============================ */
prevBtn.addEventListener("click", () => {
  const buttons = getPlaybackButtons();
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
/* ============================
   ⭐ 進度條
============================ */
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;

  progress.value = (audio.currentTime / audio.duration) * 100;
  progress.style.setProperty("--progress", `${progress.value}%`);
  currentTimeText.textContent = formatTime(audio.currentTime);
  durationText.textContent = formatTime(audio.duration);
});

audio.addEventListener("ended", () => {
  if (isRepeatOne && audio.src) {
    audio.currentTime = 0;
    audio.play();
    return;
  }
  const buttons = getPlaybackButtons();
  if (!buttons.length) return;

  tonearm.classList.remove("playing");
  cover.style.animationPlayState = "paused";
  cd.style.animationPlayState = "paused";

  setTimeout(() => {
    const nextIndex = getNextPlaybackIndex(buttons);
    if (nextIndex < 0) return;
    currentIndex = nextIndex;
    playFromPlaylist(currentIndex);
  }, 400);
});

progress.addEventListener("input", () => {
  if (!audio.duration) return;
  audio.currentTime = (progress.value / 100) * audio.duration;
  progress.style.setProperty("--progress", `${progress.value}%`);
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
  if (currentUser !== "fungfung") clearCommentNotification(songName);

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

  let replyMessages = [];
  comments.forEach((c) => {
    if (currentUser === "fungfung" || !c.replyTo && c.user === currentUser || c.replyTo === currentUser || c.user === currentUser) {
      showComment(c, list);
    }
    if (c.replyTo === currentUser) {
      replyMessages.push(`${c.user} 回覆了你：${c.message}`);
    }
  });

  document.getElementById("reply-notice").textContent = replyMessages.join("\n");

  if (currentUser === "fungfung") {
    await supabaseClient
      .from("comments")
      .update({ isRead: true })
      .eq("songName", songName)
      .eq("isRead", false);
    await checkNewComments();
  }
}

// 檢查新留言通知：fungfung 直接以 isRead 顯示，並列出留言來自哪一首歌。
async function checkNewComments() {
  const notice = document.getElementById("comment-notice");
  if (friendName === "fungfung") {
    const { data, error } = await supabaseClient
      .from("comments")
      .select("id, songName, user, message, time")
      .eq("isRead", false)
      .neq("user", friendName)
      .order("id", { ascending: false });

    if (error || !data) return;
    showNotificationBadge(data.length > 0);
    notice.textContent = data.length
      ? `有 ${data.length} 個未讀留言：\n` + data.map(c => `「${c.songName}」— ${c.user}：${c.message}`).join("\n")
      : "";
    return;
  }

  const lastCheckTime = localStorage.getItem(`last_comment_check_${friendName}`) || new Date(0).toISOString();
  const { data, error } = await supabaseClient
    .from("comments")
    .select("songName, time")
    .gt("time", lastCheckTime)
    .neq("user", friendName);
  if (error || !data) return;
  if (data.length > 0) {
    showNotificationBadge(true);
    const notifiedSongs = JSON.parse(localStorage.getItem(`notified_songs_${friendName}`) || "[]");
    data.forEach(c => { if (!notifiedSongs.includes(c.songName)) notifiedSongs.push(c.songName); });
    localStorage.setItem(`notified_songs_${friendName}`, JSON.stringify(notifiedSongs));
  }
}

function showNotificationBadge(show) {
  const select = document.getElementById("categories-select");
  const badgeId = "comment-badge";
  let badge = document.getElementById(badgeId);
  if (show) {
    if (!badge) {
      badge = document.createElement("span");
      badge.id = badgeId;
      badge.textContent = "🔴";
      badge.style.marginLeft = "5px";
      badge.title = "有未讀留言！";
      select.parentNode.insertBefore(badge, select.nextSibling);
    }
  } else if (badge) {
    badge.remove();
  }
}

function clearCommentNotification(songName) {
  let notifiedSongs = JSON.parse(localStorage.getItem(`notified_songs_${friendName}`) || "[]");
  notifiedSongs = notifiedSongs.filter(name => name !== songName);
  localStorage.setItem(`notified_songs_${friendName}`, JSON.stringify(notifiedSongs));
  if (notifiedSongs.length === 0) {
    showNotificationBadge(false);
    localStorage.setItem(`last_comment_check_${friendName}`, new Date().toISOString());
  }
}

// 每 30 秒檢查一次新留言
setInterval(checkNewComments, 30000);
window.addEventListener("load", checkNewComments);

function showComment(c, list) {
  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${c.user}</strong>：${c.message}
    <br><small>${c.time}</small>
    <br><button class="reply-btn" data-user="${c.user}">回覆</button>
  `;
  list.appendChild(li);
}

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("like-icon")) return;

  const songSrc = e.target.getAttribute("data-src");
  const username = friendName;

  const { data: existing } = await supabaseClient
    .from("song_likes")
    .select("*")
    .eq("song_src", songSrc)
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    await supabaseClient.from("song_likes").delete().eq("id", existing.id);
    e.target.textContent = "👍";
  } else {
    await supabaseClient.from("song_likes").insert({
      song_src: songSrc,
      username: username
    });
    e.target.textContent = "👍🏻";
  }

  loadLikes();
});

/* ============================
   ⭐ 送出留言（單一事件綁定，避免重複寫入）
============================ */
document.getElementById("comment-submit").addEventListener("click", async () => {
  const input = document.getElementById("comment-input");
  const message = input.value.trim();
  if (!message || !title.textContent || title.textContent === "選擇一首歌播放") return;

  const songName = title.textContent;
  const { error } = await supabaseClient.from("comments").insert({
    songName,
    user: friendName,
    message,
    replyTo: input.dataset.replyTo || null,
    isRead: false,
    time: new Date().toISOString(),
  });

  if (error) {
    alert("留言寫入失敗：" + error.message);
    console.error(error);
    return;
  }

  input.value = "";
  input.dataset.replyTo = "";
  await notifySongEventRecipients("comment", songsData.find(song => song.name === songName)?.src, `${friendName} 發表留言：「${message}」`);
  await loadComments(songName, friendName);
  document.getElementById("comment-hint").textContent = `「${songName}」已有留言：${message}`;
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

    // ⭐ 同步載入所有後台資料
    await loadPlayHistory();     // 播放紀錄
    await loadAllLoginHistory(); // 登入紀錄
    await loadAllUsers();        // 用戶管理
    await loadLikeHistory();     // ⭐ Like 紀錄（你新加的）

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
   ⭐ 管理員：GitHub 設定儲存
============================ */
const ghUsernameInput = document.getElementById("gh-username");
const ghRepoInput = document.getElementById("gh-repo");
const ghTokenInput = document.getElementById("gh-token");
const ghSaveBtn = document.getElementById("gh-save-btn");

// 載入已儲存的設定
window.addEventListener("load", () => {
  ghUsernameInput.value = localStorage.getItem("gh_username") || "";
  ghRepoInput.value = localStorage.getItem("gh_repo") || "";
  ghTokenInput.value = localStorage.getItem("gh_token") || "";
});

ghSaveBtn.addEventListener("click", () => {
  localStorage.setItem("gh_username", ghUsernameInput.value.trim());
  localStorage.setItem("gh_repo", ghRepoInput.value.trim());
  localStorage.setItem("gh_token", ghTokenInput.value.trim());
  alert("GitHub 設定已儲存至本地瀏覽器！");
});

/* ============================
   ⭐ 管理員：批量上傳歌曲 (GitHub 模式)
============================ */
const batchUploadContainer = document.getElementById("batch-upload-container");
const uploadSubmitBtn = document.getElementById("upload-submit-btn");
const uploadStatus = document.getElementById("upload-status");

// 動態生成 6 個上傳組件
function initBatchUploadUI() {
  if (!batchUploadContainer) return;
  batchUploadContainer.innerHTML = "";
  for (let i = 1; i <= 6; i++) {
    const item = document.createElement("div");
    item.classList.add("upload-item");
    item.innerHTML = `
      <h4>歌曲 ${i}</h4>
      <div class="upload-grid">
        <div>
          <label>歌曲名稱：</label>
          <input type="text" class="song-name" placeholder="輸入歌名">
        </div>
        <div>
          <label>分類：</label>
          <select class="song-cat">
            <option value="slow songs">慢歌</option>
            <option value="fast songs">快歌</option>
            <option value="female">女歌男唱</option>
            <option value="kids">兒歌/卡通</option>
            <option value="opera">粵曲</option>
            <option value="festival">節日</option>
            <option value="other">其他</option>
            <option value="man">敏敏</option>
            <option value="manman">安眠歌單</option>
          </select>
        </div>
        <div>
          <label>音檔 (.mp3)：</label>
          <input type="file" class="song-file" accept="audio/mpeg">
        </div>
        <div>
          <label>封面 (選填)：</label>
          <input type="file" class="cover-file" accept="image/*">
        </div>
      </div>
    `;
    batchUploadContainer.appendChild(item);
  }
}

// 呼叫初始化
initBatchUploadUI();

async function uploadToGitHub(file, path) {
  const username = localStorage.getItem("gh_username");
  const repo = localStorage.getItem("gh_repo");
  const token = localStorage.getItem("gh_token");

  if (!username || !repo || !token) {
    throw new Error("請先設定 GitHub 帳號、倉庫與 Token！");
  }

  const reader = new FileReader();
  const base64Promise = new Promise((resolve) => {
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.readAsDataURL(file);
  });
  const content = await base64Promise;

  const url = `https://api.github.com/repos/${username}/${repo}/contents/${path}`;
  
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Authorization": `token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Upload ${path} via Fung Fung Music`,
      content: content,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`GitHub 上傳失敗: ${errorData.message}`);
  }

  return `https://raw.githubusercontent.com/${username}/${repo}/main/${path}`;
}

uploadSubmitBtn.addEventListener("click", async () => {
  const items = document.querySelectorAll(".upload-item");
  const uploadTasks = [];

  // 收集所有填寫了歌名與檔案的任務
  items.forEach((item, index) => {
    const name = item.querySelector(".song-name").value.trim();
    const cat = item.querySelector(".song-cat").value;
    const sFile = item.querySelector(".song-file").files[0];
    const cFile = item.querySelector(".cover-file").files[0];

    if (name && sFile) {
      uploadTasks.push({ name, cat, sFile, cFile, index: index + 1 });
    }
  });

  if (uploadTasks.length === 0) {
    alert("請至少填寫一首歌曲的名稱並選擇音檔！");
    return;
  }

  uploadStatus.style.display = "block";
  uploadStatus.style.color = "yellow";
  uploadSubmitBtn.disabled = true;

  let successCount = 0;

  for (const task of uploadTasks) {
    try {
      uploadStatus.textContent = `[${task.index}/6] 正在上傳「${task.name}」至 GitHub...`;
      
      // 1. 上傳音檔
      const sExt = task.sFile.name.split(".").pop();
      const sPath = `music/${Date.now()}_${task.name}.${sExt}`;
      const sUrl = await uploadToGitHub(task.sFile, sPath);

      // 2. 上傳封面
      let cUrl = "covers/default.jpg";
      if (task.cFile) {
        const cExt = task.cFile.name.split(".").pop();
        const cPath = `covers/${Date.now()}_${task.name}.${cExt}`;
        cUrl = await uploadToGitHub(task.cFile, cPath);
      }

      // 3. 同步資料庫
      const { error: dbError } = await supabaseClient.from("songs").insert([{
        name: task.name,
        src: sUrl,
        cover: cUrl,
        cat: task.cat,
        uploaded_by: friendName
      }]);

      if (!dbError) {
        successCount++;
        // 即時加入本地清單
        songsData.push({ name: task.name, src: sUrl, cover: cUrl, cat: task.cat });
      }
    } catch (err) {
      console.error(`歌曲 ${task.name} 上傳失敗:`, err);
      uploadStatus.style.color = "red";
      uploadStatus.textContent = `歌曲「${task.name}」上傳失敗: ${err.message}`;
      break; // 出錯則停止後續上傳
    }
  }

  if (successCount === uploadTasks.length) {
    uploadStatus.style.color = "lightgreen";
    uploadStatus.textContent = `成功批量上傳 ${successCount} 首歌曲！`;
    generatePlaylist(document.getElementById("categories-select").value);
    // 清空輸入框
    document.querySelectorAll(".song-name").forEach(i => i.value = "");
    document.querySelectorAll(".song-file").forEach(i => i.value = "");
    document.querySelectorAll(".cover-file").forEach(i => i.value = "");
  }
  uploadSubmitBtn.disabled = false;
});

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
   🎁 遊戲禮物箱及送禮系統
============================ */
const giftAssets = {
  sakura: "assets/sakura.png", british: "assets/white-british-shorthair.png", tabby: "assets/brown-tabby.png",
  heart: "assets/heart-gift.png", coffee: "assets/coffee-gift.png", chocolate: "assets/chocolate-gift.png",
  phone: "assets/phone-gift.png", headphones: "assets/headphones-gift.png",
};
const giftLabels = { sakura: "櫻花", british: "白色英短", tabby: "啡色唐猫", heart: "心心", coffee: "咖啡", chocolate: "朱古力", phone: "手機", headphones: "頭帶式耳機" };
const basicGiftTypes = ["sakura", "british", "tabby"];
const exchangeRecipes = [
  { id: "heart", label: "心心", cost: 10 }, { id: "coffee", label: "咖啡", cost: 10 }, { id: "chocolate", label: "朱古力", cost: 10 },
  { id: "phone", label: "手機", cost: 30 }, { id: "headphones", label: "頭帶式耳機", cost: 30 },
];
const allGiftTypes = Object.keys(giftLabels);
const emptyGiftCounts = () => Object.fromEntries(allGiftTypes.map(type => [type, 0]));
let currentGiftSongKey = null, giftRainTimer = null, giftRevealTimer = null, giftSequenceTimer = null;
let giftInventory = emptyGiftCounts(), songGiftCache = {};
function giftLocalKey() { return `gift_inventory_${friendName}`; }
function getGiftStorageKey(songKey) { return `song_gifts_${encodeURIComponent(songKey || "unknown")}`; }
function readLocalInventory() { try { return { ...emptyGiftCounts(), ...JSON.parse(localStorage.getItem(giftLocalKey()) || "{}") }; } catch { return emptyGiftCounts(); } }
async function loadGiftInventory() {
  const { data, error } = await supabaseClient.from("user_gifts").select("gift_type, quantity").eq("username", friendName);
  giftInventory = emptyGiftCounts();
  if (!error && Array.isArray(data)) data.forEach(row => { if (giftInventory[row.gift_type] !== undefined) giftInventory[row.gift_type] = Number(row.quantity) || 0; });
  else giftInventory = readLocalInventory();
  localStorage.setItem(giftLocalKey(), JSON.stringify(giftInventory)); renderGiftBox();
}
async function saveGiftInventory() {
  localStorage.setItem(giftLocalKey(), JSON.stringify(giftInventory));
  const rows = allGiftTypes.map(gift_type => ({ username: friendName, gift_type, quantity: giftInventory[gift_type] || 0 }));
  const { error } = await supabaseClient.from("user_gifts").upsert(rows, { onConflict: "username,gift_type" }); return !error;
}
function getSongGifts(songKey = currentGiftSongKey) { try { return { ...emptyGiftCounts(), ...JSON.parse(localStorage.getItem(getGiftStorageKey(songKey)) || "{}") }; } catch { return emptyGiftCounts(); } }
async function loadSongGifts(songKey) {
  if (!songKey) return;
  const { data, error } = await supabaseClient.from("song_gifts_public").select("gift_type, quantity").eq("song_src", songKey);
  songGiftCache[songKey] = emptyGiftCounts();
  if (!error && Array.isArray(data)) data.forEach(row => { if (songGiftCache[songKey][row.gift_type] !== undefined) songGiftCache[songKey][row.gift_type] = Number(row.quantity) || 0; });
  else songGiftCache[songKey] = getSongGifts(songKey);
  localStorage.setItem(getGiftStorageKey(songKey), JSON.stringify(songGiftCache[songKey])); renderSongGifts();
  if (!audio.paused) startGiftRain();
}
function renderSongGifts() {
  const box = document.getElementById("song-gifts"); if (!box) return;
  const gifts = songGiftCache[currentGiftSongKey] || getSongGifts();
  const entries = allGiftTypes.filter(key => gifts[key] > 0);
  box.innerHTML = entries.length ? `<span class="gift-label">歌曲禮物：</span>${entries.map(key => `<span class="song-gift"><img src="${giftAssets[key]}" alt="${giftLabels[key]}">${giftLabels[key]} × ${gifts[key]}</span>`).join("")}` : "";
}
function setCurrentSongForGifts(songKey) {
  currentGiftSongKey = songKey; renderSongGifts();
  const currentSong = songsData.find(song => song.src === songKey); const label = document.getElementById("gift-current-song");
  if (label) label.textContent = currentSong ? `正在播放：${currentSong.name}` : "正在播放：沒有歌曲，請先播放歌曲再送禮";
  loadSongGifts(songKey);
}
async function awardGift(type) { if (!giftLabels[type]) return; giftInventory = readLocalInventory(); giftInventory[type] = (giftInventory[type] || 0) + 1; await saveGiftInventory(); renderGiftBox(); }
async function notifyFungfung(kind, songKey, detail) {
  if (String(friendName).toLowerCase() === "fungfung") return;
  const song = songsData.find(item => item.src === songKey);
  const songName = song ? song.name : songKey;
  try {
    await supabaseClient.from("user_notifications").insert({
      recipient_username: "fungfung",
      kind,
      song_src: songKey || null,
      message: `${detail}（歌曲：${songName}）`,
      is_read: false
    });
  } catch (_) { /* 通知表未建立時不影響送禮或 Like */ }
}
async function checkFungfungNotifications() {
  const currentUser = String(friendName || "").toLowerCase();
  const recipient = ["fungfung", "manman"].includes(currentUser) ? currentUser : null;
  if (!recipient) return;
  const notice = document.getElementById("comment-notice");
  try {
    const { data, error } = await supabaseClient.from("user_notifications")
      .select("id, kind, message, created_at").eq("recipient_username", recipient)
      .eq("is_read", false).order("created_at", { ascending: false });
    if (error || !data) return;
    showNotificationBadge(data.length > 0);
    if (notice) {
      notice.textContent = data.length
        ? `有 ${data.length} 個未讀通知：\\n` + data.map(item => item.message).join("\\n")
        : "";
      notice.classList.add("notice-collapsed");
      notice.setAttribute("aria-hidden", "true");
    }
  } catch (_) {}
}
async function sendGiftToSong(type, songKey, quantity = 1) {
  quantity = Number.parseInt(quantity, 10);
  if (!allGiftTypes.includes(type) || !songKey || !Number.isInteger(quantity) || quantity < 1) return { ok: false, message: "請選擇有效禮物及數量。" };
  giftInventory = readLocalInventory(); if ((giftInventory[type] || 0) < quantity) return { ok: false, message: `你的禮品箱沒有足夠的${giftLabels[type]}。` };
  const current = songGiftCache[songKey] || getSongGifts(songKey); current[type] = (current[type] || 0) + quantity; giftInventory[type] -= quantity;
  const { error } = await supabaseClient.from("song_gifts_public").upsert({ song_src: songKey, gift_type: type, quantity: current[type], updated_by: friendName }, { onConflict: "song_src,gift_type" });
  if (error) localStorage.setItem(getGiftStorageKey(songKey), JSON.stringify(current));
  songGiftCache[songKey] = current; await saveGiftInventory(); renderGiftBox(); renderSongGifts();
  await notifyFungfung("gift", songKey, `${friendName} 送出了 ${quantity} 個${giftLabels[type]}`);
  triggerGiftReceived(type, quantity); return { ok: true, message: `已將 ${quantity} 個${giftLabels[type]}送到目前播放歌曲。` };
}
async function exchangeGift(recipeId) {
  const recipe = exchangeRecipes.find(item => item.id === recipeId); if (!recipe) return { ok: false, message: "找不到兌換項目。" };
  giftInventory = readLocalInventory(); if (!basicGiftTypes.every(type => (giftInventory[type] || 0) >= recipe.cost)) return { ok: false, message: `需要各 ${recipe.cost} 個櫻花、白色英短及啡色唐猫。` };
  basicGiftTypes.forEach(type => giftInventory[type] -= recipe.cost); giftInventory[recipe.id] = (giftInventory[recipe.id] || 0) + 1;
  await saveGiftInventory(); renderGiftBox(); celebrateExchange(recipe); return { ok: true, message: `已兌換 1 個${recipe.label}。` };
}
function getVisibleSongsForUser() { const currentUser = friendName.toLowerCase(); return songsData.filter(song => !["man", "manman"].includes(song.cat) || currentUser === "fungfung" || currentUser === "manman").filter(song => !Array.isArray(song.allowedUsers) || song.allowedUsers.map(user => String(user).toLowerCase()).includes(currentUser)); }
function renderGiftBox() {
  const inventoryBox = document.getElementById("gift-inventory"), typeSelect = document.getElementById("main-gift-type-select"), exchangeBox = document.getElementById("gift-exchange-list");
  const inventoryHTML = allGiftTypes.map(key => `<span class="inventory-gift"><img src="${giftAssets[key]}" alt="${giftLabels[key]}"><b>${giftLabels[key]}</b><span>× ${giftInventory[key] || 0}</span></span>`).join("");
  if (inventoryBox) inventoryBox.innerHTML = inventoryHTML;
  const currentSong = songsData.find(song => song.src === currentGiftSongKey); const label = document.getElementById("gift-current-song"); if (label) label.textContent = currentSong ? `正在播放：${currentSong.name}` : "正在播放：沒有歌曲，請先播放歌曲再送禮";
  if (typeSelect) {
    const symbols = { sakura: "🌸", british: "🐈", tabby: "🐈‍⬛", heart: "💗", coffee: "☕", chocolate: "🍫", phone: "📱", headphones: "🎧" };
    typeSelect.innerHTML = allGiftTypes.map(key => `<option value="${key}" ${giftInventory[key] > 0 ? "" : "disabled"}>${symbols[key]} × ${giftInventory[key] || 0}</option>`).join("");
  }
  if (exchangeBox) { exchangeBox.innerHTML = exchangeRecipes.map(recipe => `<div class="exchange-item"><img src="${giftAssets[recipe.id]}" alt="${recipe.label}"><div><b>${recipe.label} × 1</b><small>各 ${recipe.cost} 個櫻花／白色英短／啡色唐猫</small></div><button type="button" data-exchange="${recipe.id}">兌換</button></div>`).join(""); exchangeBox.querySelectorAll("[data-exchange]").forEach(button => button.addEventListener("click", async () => { const status = document.getElementById("gift-box-status"), result = await exchangeGift(button.dataset.exchange); if (status) status.textContent = result.message; })); }
}
function openGiftBox() { const modal = document.getElementById("gift-box-modal"); if (modal) { modal.style.display = "flex"; renderGiftBox(); loadGiftInventory(); } }
document.getElementById("gift-box-open")?.addEventListener("click", openGiftBox);
document.getElementById("gift-box-close")?.addEventListener("click", () => { document.getElementById("gift-box-modal").style.display = "none"; });
document.getElementById("main-send-gift-btn")?.addEventListener("click", async () => { const status = document.getElementById("main-gift-status"), quantity = document.getElementById("main-gift-quantity").value; if (!currentGiftSongKey) { if (status) status.textContent = "請先播放一首歌曲，禮物只會送到正在播放的歌曲。"; return; } const result = await sendGiftToSong(document.getElementById("main-gift-type-select").value, currentGiftSongKey, quantity); if (status) status.textContent = result.message; });
function showGiftFeature(type) {
  const feature = document.getElementById("gift-feature");
  if (!feature) return;
  feature.classList.remove("show");
  feature.innerHTML = `<img src="${giftAssets[type]}" alt="${giftLabels[type]}">`;
  requestAnimationFrame(() => feature.classList.add("show"));
}
function beginGiftRain() {
  clearInterval(giftRainTimer);
  const gifts = songGiftCache[currentGiftSongKey] || getSongGifts();
  const types = allGiftTypes.filter(type => gifts[type] > 0);
  const rain = document.getElementById("gift-rain");
  if (!rain || !types.length || audio.paused) return;
  const drop = () => {
    const type = types[Math.floor(Math.random() * types.length)], item = document.createElement("img");
    item.src = giftAssets[type]; item.className = "gift-rain-item"; item.alt = "";
    item.style.left = `${5 + Math.random() * 90}%`; item.style.animationDuration = `${4 + Math.random() * 3}s`;
    item.addEventListener("animationend", () => item.remove(), { once: true }); rain.appendChild(item);
  };
  drop(); giftRainTimer = setInterval(drop, 900);
}
function startGiftRain() {
  clearInterval(giftRainTimer); clearTimeout(giftRevealTimer); clearTimeout(giftSequenceTimer);
  const gifts = songGiftCache[currentGiftSongKey] || getSongGifts();
  const types = allGiftTypes.filter(type => gifts[type] > 0);
  if (!types.length || audio.paused) return;
  let index = 0;
  const nextFeature = () => {
    if (audio.paused || index >= types.length) { document.getElementById("gift-feature")?.classList.remove("show"); if (!audio.paused) beginGiftRain(); return; }
    showGiftFeature(types[index++]);
    giftSequenceTimer = setTimeout(nextFeature, 3000);
  };
  nextFeature();
}
function triggerGiftReceived(type) {
  if (!audio.paused && currentGiftSongKey) startGiftRain();
}
function stopGiftRain() {
  clearInterval(giftRainTimer); giftRainTimer = null; clearTimeout(giftRevealTimer); clearTimeout(giftSequenceTimer);
  const rain = document.getElementById("gift-rain"); if (rain) rain.innerHTML = "";
  const feature = document.getElementById("gift-feature"); if (feature) feature.classList.remove("show");
}
function celebrateExchange(recipe) { const card = document.querySelector(".gift-box-card"); if (!card) return; const effect = document.createElement("div"); effect.className = "exchange-success"; effect.innerHTML = `<img src="${giftAssets[recipe.id]}" alt="${recipe.label}"><b>兌換成功！</b><span>${recipe.label} × 1</span>`; card.appendChild(effect); setTimeout(() => effect.remove(), 1600); }

audio.addEventListener("play", startGiftRain); audio.addEventListener("pause", stopGiftRain); audio.addEventListener("ended", stopGiftRain); window.addEventListener("load", loadGiftInventory);
setInterval(checkFungfungNotifications, 30000);
window.addEventListener("load", checkFungfungNotifications);

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

function showGameEndControls(message, restartGame) {
  const ui = document.getElementById("game-ui");
  ui.innerHTML = `<div class="game-result">${message}</div><div class="game-end-actions"><button id="game-restart" type="button">重新開始</button><button id="game-leave" type="button">離開</button></div>`;
  document.getElementById("game-restart").addEventListener("click", () => {
    resetGameEvents();
    restartGame();
  }, { once: true });
  document.getElementById("game-leave").addEventListener("click", () => {
    document.getElementById("game-close").click();
  }, { once: true });
}

document.getElementById("game-close").addEventListener("click", () => {
  document.getElementById("game-modal").style.display = "none";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("game-ui").innerHTML = "";

  if (activeGameCleanup) activeGameCleanup();
  activeGameCleanup = null;
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
let activeGameCleanup = null;

function startSakuraGame() {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const ui = document.getElementById("game-ui");
  canvas.width = 400;
  canvas.height = 400;

  const sakuraImage = new Image();
  const basketImage = new Image();
  sakuraImage.src = giftAssets.sakura;
  basketImage.src = "assets/basket.png";

  let petals = [];
  let basketX = 160;
  let score = 0;
  let timeLeft = 30;
  let gameRunning = true;

  function createPetal() {
    petals.push({ x: 10 + Math.random() * 380, y: -30, speed: 1.5 + Math.random() * 2.5, rotation: Math.random() * 6.28 });
  }

  function moveBasket(clientX) {
    const rect = canvas.getBoundingClientRect();
    basketX = Math.max(0, Math.min(320, clientX - rect.left - 40));
  }
  document.onmousemove = e => moveBasket(e.clientX);
  canvas.ontouchmove = e => { e.preventDefault(); moveBasket(e.touches[0].clientX); };

  function update() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, 400, 400);
    const sakuraSky = ctx.createLinearGradient(0, 0, 0, 400);
    sakuraSky.addColorStop(0, "#ffd9eb");
    sakuraSky.addColorStop(1, "#fff8fc");
    ctx.fillStyle = sakuraSky;
    ctx.fillRect(0, 0, 400, 400);
    // 櫻花主題背景：遠景山丘、樹幹及櫻花樹冠。
    ctx.fillStyle = "#e8b6cf";
    ctx.beginPath(); ctx.arc(70, 190, 95, 0, Math.PI * 2); ctx.arc(330, 170, 120, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#80505d"; ctx.fillRect(20, 0, 18, 350); ctx.strokeStyle = "#80505d"; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(30, 150); ctx.lineTo(130, 55); ctx.moveTo(30, 210); ctx.lineTo(175, 125); ctx.stroke();
    ctx.fillStyle = "#ffd5e7"; ctx.fillRect(0, 340, 400, 60);

    petals.forEach((petal, i) => {
      petal.y += petal.speed;
      petal.rotation += 0.03;
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.rotation);
      if (sakuraImage.complete && sakuraImage.naturalWidth) ctx.drawImage(sakuraImage, -14, -14, 28, 28);
      else { ctx.fillStyle = "#ff8fbd"; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();

      if (petal.y > 325 && petal.x > basketX && petal.x < basketX + 80) {
        score++;
        awardGift("sakura");
        petals.splice(i, 1);
      } else if (petal.y > 410) {
        petals.splice(i, 1);
      }
    });

    if (basketImage.complete && basketImage.naturalWidth) ctx.drawImage(basketImage, basketX, 310, 80, 70);
    else { ctx.fillStyle = "#c98243"; ctx.fillRect(basketX, 345, 80, 25); }
    ui.innerHTML = `🌸 分數：${score}｜剩餘時間：${timeLeft}s｜每接一朵櫻花送到歌曲`;
    requestAnimationFrame(update);
  }

  const finish = () => {
    gameRunning = false;
    clearInterval(sakuraTimer);
    clearInterval(sakuraPetalTimer);
    activeGameCleanup = null;
    showGameEndControls(`🎉 櫻花接花完成！分數：${score}｜櫻花禮物已加入你的禮品箱`, startSakuraGame);
  };
  activeGameCleanup = finish;
  sakuraPetalTimer = setInterval(createPetal, 500);
  sakuraTimer = setInterval(() => { timeLeft--; if (timeLeft <= 0) finish(); }, 1000);
  update();
}

/* ============================
   🐱 卡通跳跳樂
============================ */
let cartoonObstacleTimer = null;

function startCartoonGame() {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  const ui = document.getElementById("game-ui");
  canvas.width = 400;
  canvas.height = 400;

  const playerImage = new Image();
  const obstacleImage = new Image();
  playerImage.src = giftAssets.british;
  obstacleImage.src = giftAssets.tabby;

  const player = { x: 35, y: 300, width: 30, height: 30, dy: 0, jumping: false };
  let obstacles = [];
  let score = 0;
  let timeLeft = 30;
  let gameRunning = true;
  let cartoonTimer = null;

  function jump() {
    if (!gameRunning || player.jumping) return;
    player.dy = -11;
    player.jumping = true;
  }
  document.onkeydown = e => { if (e.code === "Space") { e.preventDefault(); jump(); } };
  canvas.ontouchstart = e => { e.preventDefault(); jump(); };

  function createObstacle() {
    obstacles.push({ x: 400, y: 320, width: 30, height: 30, speed: 4 });
  }

  function finish(message) {
    if (!gameRunning) return;
    gameRunning = false;
    clearInterval(cartoonObstacleTimer);
    clearInterval(cartoonTimer);
    activeGameCleanup = null;
    showGameEndControls(`${message} 分數：${score}｜禮物已加入你的禮品箱`, startCartoonGame);
  }
  activeGameCleanup = () => finish("🐱 遊戲已結束！");
  cartoonObstacleTimer = setInterval(() => { if (gameRunning) createObstacle(); }, 1200);
  cartoonTimer = setInterval(() => {
    if (!gameRunning) return;
    timeLeft--;
    if (timeLeft <= 0) finish("🎉 30 秒完成！");
  }, 1000);

  function update() {
    if (!gameRunning) return;
    ctx.clearRect(0, 0, 400, 400);
    const cartoonSky = ctx.createLinearGradient(0, 0, 0, 400);
    cartoonSky.addColorStop(0, "#75c9f4");
    cartoonSky.addColorStop(1, "#e7f8ff");
    ctx.fillStyle = cartoonSky; ctx.fillRect(0, 0, 400, 400);
    // 卡通跳跳主題背景：雲朵、遠山、草地及小花。
    ctx.fillStyle = "rgba(255,255,255,.85)";
    [[70,70,32],[125,80,24],[300,95,35],[345,78,24]].forEach(([x,y,r]) => { ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle = "#7abf8f"; ctx.beginPath(); ctx.moveTo(0, 310); ctx.quadraticCurveTo(100,245,200,310); ctx.quadraticCurveTo(300,245,400,305); ctx.lineTo(400,400); ctx.lineTo(0,400); ctx.fill();
    ctx.fillStyle = "#bde7c8"; ctx.fillRect(0, 340, 400, 60);
    ctx.fillStyle = "#ffcf5c"; [20,90,170,270,360].forEach(x => { ctx.beginPath(); ctx.arc(x,350,3,0,Math.PI*2); ctx.fill(); });

    player.y += player.dy; player.dy += 0.55;
    if (player.y >= 300) { player.y = 300; player.dy = 0; player.jumping = false; }
    if (playerImage.complete && playerImage.naturalWidth) ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

    obstacles.forEach((obstacle, i) => {
      obstacle.x -= obstacle.speed;
      if (obstacleImage.complete && obstacleImage.naturalWidth) ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      if (player.x < obstacle.x + obstacle.width && player.x + player.width > obstacle.x && player.y < obstacle.y + obstacle.height && player.y + player.height > obstacle.y) {
        finish("💥 撞到啡色唐猫，Game Over！");
      }
      if (obstacle.x + obstacle.width < 0) {
        obstacles.splice(i, 1);
        score++;
        awardGift(Math.random() < 0.5 ? "tabby" : "british");
      }
    });
    if (!gameRunning) return;
    ui.innerHTML = `🐱 分數：${score}｜剩餘時間：${timeLeft}s｜跳過啡色唐猫會送出隨機貓咪禮物`;
    requestAnimationFrame(update);
  }
  update();
}

/* ============================
   🖱️ 右鍵選單 & 置頂按鈕邏輯
============================ */
const contextMenu = document.getElementById("context-menu");
const scrollToTopBtn = document.getElementById("scroll-to-top");
let selectedSongSrc = null;
let longPressTimer = null;

// 右鍵選單
document.addEventListener("contextmenu", (e) => {
  const item = e.target.closest(".playlist-item");
  if (item) {
    e.preventDefault();
    selectedSongSrc = item.getAttribute("data-src");
    contextMenu.style.display = "block";
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
  } else {
    contextMenu.style.display = "none";
  }
});

// 長按偵測 (平板/手機)
document.addEventListener("touchstart", (e) => {
  const item = e.target.closest(".playlist-item");
  if (item) {
    longPressTimer = setTimeout(() => {
      selectedSongSrc = item.getAttribute("data-src");
      contextMenu.style.display = "block";
      contextMenu.style.left = `${e.touches[0].pageX}px`;
      contextMenu.style.top = `${e.touches[0].pageY}px`;
    }, 600); // 600ms 長按
  }
});

document.addEventListener("touchend", () => {
  clearTimeout(longPressTimer);
});

// 點擊其他地方關閉選單
document.addEventListener("click", () => {
  contextMenu.style.display = "none";
});

// 選單功能
document.getElementById("menu-add-to-playlist").addEventListener("click", () => {
  if (selectedSongSrc) addToMyPlaylist(selectedSongSrc);
});

document.getElementById("menu-play-now").addEventListener("click", () => {
  if (selectedSongSrc) {
    const buttons = getPlaybackButtons();
    for (let i = 0; i < buttons.length; i++) {
      if (buttons[i].getAttribute("data-src") === selectedSongSrc) {
        playFromPlaylist(i);
        break;
      }
    }
  }
});

// 置頂按鈕邏輯
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    scrollToTopBtn.classList.add("show");
  } else {
    scrollToTopBtn.classList.remove("show");
  }
});

scrollToTopBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* ============================
   ⭐ 個人化歌單邏輯
============================ */
const myPlaylistItemsContainer = document.getElementById("my-playlist-items");
const myPlaylistTitle = document.getElementById("my-playlist-title");
const editPlaylistNameBtn = document.getElementById("edit-playlist-name");
const playlistSelect = document.getElementById("playlist-select");
const newPlaylistBtn = document.getElementById("new-playlist-btn");
const deletePlaylistBtn = document.getElementById("delete-playlist-btn");
const playlistsKey = `playlists_${friendName}`;
const activePlaylistKey = `active_playlist_${friendName}`;

function getPlaylists() {
  let playlists;
  try { playlists = JSON.parse(localStorage.getItem(playlistsKey) || "null"); } catch { playlists = null; }
  if (!playlists || typeof playlists !== "object" || Array.isArray(playlists) || Object.keys(playlists).length === 0) {
    let oldSongs = [];
    try { oldSongs = JSON.parse(localStorage.getItem(`playlist_${friendName}`) || "[]"); } catch { oldSongs = []; }
    playlists = { default: { name: localStorage.getItem(`playlist_name_${friendName}`) || "我的歌單", songs: oldSongs } };
    localStorage.setItem(playlistsKey, JSON.stringify(playlists));
  }
  return playlists;
}

function savePlaylists(playlists) {
  localStorage.setItem(playlistsKey, JSON.stringify(playlists));
}

function getActivePlaylistId() {
  const playlists = getPlaylists();
  const saved = localStorage.getItem(activePlaylistKey);
  return saved && playlists[saved] ? saved : Object.keys(playlists)[0];
}

function getActivePlaylist() {
  const playlists = getPlaylists();
  return playlists[getActivePlaylistId()];
}

function renderPlaylistSelector() {
  const playlists = getPlaylists();
  const activeId = getActivePlaylistId();
  playlistSelect.innerHTML = Object.entries(playlists).map(([id, p]) =>
    `<option value="${id}">${p.name}</option>`
  ).join("");
  playlistSelect.value = activeId;
  myPlaylistTitle.textContent = playlists[activeId].name;
}

function refreshCurrentPlaylistView() {
  renderPlaylistSelector();
  renderMyPlaylist();
  if (document.getElementById("categories-select").value === "my-playlist") {
    generatePlaylist("my-playlist", searchBox.value.trim().toLowerCase());
  }
}

playlistSelect.addEventListener("change", () => {
  localStorage.setItem(activePlaylistKey, playlistSelect.value);
  refreshCurrentPlaylistView();
});

newPlaylistBtn.addEventListener("click", () => {
  const name = prompt("請輸入新歌單名稱：", "我的新歌單");
  if (!name || !name.trim()) return;
  const playlists = getPlaylists();
  const id = `playlist_${Date.now()}`;
  playlists[id] = { name: name.trim(), songs: [] };
  savePlaylists(playlists);
  localStorage.setItem(activePlaylistKey, id);
  refreshCurrentPlaylistView();
});

editPlaylistNameBtn.addEventListener("click", () => {
  const playlists = getPlaylists();
  const id = getActivePlaylistId();
  const newName = prompt("請輸入新的歌單名稱：", playlists[id].name);
  if (newName && newName.trim()) {
    playlists[id].name = newName.trim();
    savePlaylists(playlists);
    refreshCurrentPlaylistView();
  }
});

deletePlaylistBtn.addEventListener("click", () => {
  const playlists = getPlaylists();
  const ids = Object.keys(playlists);
  if (ids.length <= 1) { alert("至少要保留一個歌單！"); return; }
  const id = getActivePlaylistId();
  if (!confirm(`確定要刪除「${playlists[id].name}」嗎？`)) return;
  delete playlists[id];
  savePlaylists(playlists);
  localStorage.setItem(activePlaylistKey, Object.keys(playlists)[0]);
  refreshCurrentPlaylistView();
});

// 動態歌曲清單會反覆重建，因此使用事件委派處理所有「＋」按鈕。
document.addEventListener("click", (e) => {
  const addButton = e.target.closest(".add-to-my-btn");
  if (!addButton) return;
  e.preventDefault();
  e.stopPropagation();
  addToMyPlaylist(addButton.dataset.src);
});

function addToMyPlaylist(src) {
  const playlists = getPlaylists();
  const id = getActivePlaylistId();
  const playlist = playlists[id];
  if (playlist.songs.includes(src)) { alert(`這首歌已經在「${playlist.name}」中囉！`); return; }
  playlist.songs.push(src);
  savePlaylists(playlists);
  alert(`已成功加入「${playlist.name}」！`);
  refreshCurrentPlaylistView();
}

function renderMyPlaylist() {
  const playlist = getActivePlaylist();
  myPlaylistTitle.textContent = playlist.name;
  myPlaylistItemsContainer.innerHTML = "";
  if (playlist.songs.length === 0) {
    myPlaylistItemsContainer.innerHTML = "<p style='color:#888; text-align:center; padding:20px;'>這個歌單還是空的，快去加入喜歡的歌吧！</p>";
    return;
  }
  playlist.songs.forEach((src, index) => {
    const song = songsData.find(s => s.src === src);
    if (!song) return;
    const item = document.createElement("div");
    item.classList.add("my-playlist-item");
    item.innerHTML = `
      <img src="${song.cover}">
      <div class="song-info"><strong>${song.name}</strong></div>
      <div class="actions">
        <button class="play-my-btn" data-src="${song.src}">▶️</button>
        <button class="move-up" data-index="${index}">🔼</button>
        <button class="move-down" data-index="${index}">🔽</button>
        <button class="remove-my-btn" data-index="${index}" style="color:#ff4d4d;">❌</button>
      </div>`;
    myPlaylistItemsContainer.appendChild(item);
  });
}

myPlaylistItemsContainer.addEventListener("click", (e) => {
  const playlists = getPlaylists();
  const id = getActivePlaylistId();
  const playlist = playlists[id];
  const index = parseInt(e.target.dataset.index, 10);
  if (e.target.classList.contains("play-my-btn")) {
    const buttons = getPlaybackButtons();
    const buttonIndex = [...buttons].findIndex(b => b.dataset.src === e.target.dataset.src);
    if (buttonIndex >= 0) playFromPlaylist(buttonIndex);
  } else if (e.target.classList.contains("move-up") && index > 0) {
    [playlist.songs[index], playlist.songs[index - 1]] = [playlist.songs[index - 1], playlist.songs[index]];
    savePlaylists(playlists); refreshCurrentPlaylistView();
  } else if (e.target.classList.contains("move-down") && index < playlist.songs.length - 1) {
    [playlist.songs[index], playlist.songs[index + 1]] = [playlist.songs[index + 1], playlist.songs[index]];
    savePlaylists(playlists); refreshCurrentPlaylistView();
  } else if (e.target.classList.contains("remove-my-btn") && confirm("確定要從歌單中移除這首歌嗎？")) {
    playlist.songs.splice(index, 1);
    savePlaylists(playlists); refreshCurrentPlaylistView();
  }
});

window.addEventListener("load", () => {
  getPlaylists();
  renderPlaylistSelector();
});

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
  bar.addEventListener("click", () => { autoScroll = false; });
  setInterval(() => {
    if (!autoScroll || bar.scrollWidth <= bar.clientWidth) return;
    bar.scrollLeft += 1;
    if (bar.scrollLeft + bar.clientWidth >= bar.scrollWidth - 1) bar.scrollLeft = 0;
  }, 30);
}

/* ============================
   ⭐ 載入時啟動
============================ */
window.addEventListener("load", () => {
  autoScrollSidebar();
  fetchDynamicSongs().then(() => generatePlaylist("all", ""));
  loadLikes(); // 載入所有歌曲的 Like 數
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

async function loadLikeHistory() {
  const list = document.getElementById("like-history-list");

  const { data, error } = await supabaseClient
    .from("song_likes")
    .select("*")
    .order("id", { ascending: false });

  if (error) return;

  list.innerHTML = "";

  for (const h of data) {
    const song = songsData.find(s => s.src === h.song_src);
    const songname = song ? song.name : h.song_src;

    // 暫時當 created_at 只有日期
    const displayDate = h.created_at
      ? new Date(h.created_at).toLocaleDateString()
      : "未知日期";

    const li = document.createElement("li");
    li.innerHTML = `
      ${h.username} Like 了 ${songname}
      <br>
      <small>${displayDate}</small>
    `;
    list.appendChild(li);
  }
}
async function loadLikes() {
  const { data, error } = await supabaseClient
    .from("song_likes")
    .select("song_src");

  if (error) return;

  const countMap = {};

  data.forEach(like => {
    countMap[like.song_src] = (countMap[like.song_src] || 0) + 1;
  });

  Object.keys(countMap).forEach(src => {
    const el = document.getElementById(`like-${src}`);
    if (el) el.textContent = countMap[src];
  });
}
document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("like-icon")) return;

  const songSrc = e.target.getAttribute("data-src");
  const username = friendName;

  const { data: existing } = await supabaseClient
    .from("song_likes")
    .select("*")
    .eq("song_src", songSrc)
    .eq("username", username)
    .maybeSingle();

  if (existing) {
    // 已 Like → 取消 Like
    await supabaseClient
      .from("song_likes")
      .delete()
      .eq("id", existing.id);

    e.target.textContent = "👍";
  } else {
    // 未 Like → 新增 Like
        await supabaseClient
      .from("song_likes")
      .insert({
        song_src: songSrc,
        username: username
      });
    await notifySongEventRecipients("like", songSrc, `${username} Like 了歌曲`);
    e.target.textContent = "👍🏻";
  }

  loadLikes();
});



/* 最新互動：通知紅點切換及唱片手勢控制 */
(function setupLatestPlayerInteractions() {
  const notice = document.getElementById("comment-notice");
  let noticeExpanded = false;

  function setNoticeExpanded(expanded) {
    noticeExpanded = expanded;
    if (!notice) return;
    notice.classList.toggle("notice-collapsed", !expanded);
    notice.setAttribute("aria-hidden", String(!expanded));
  }

  // 第一次按紅點展開；第二次按紅點收起並標記目前用戶通知為已讀。
  document.addEventListener("click", async (event) => {
    const badge = event.target.closest("#comment-badge");
    if (!badge) return;
    event.preventDefault();
    event.stopPropagation();
    if (!noticeExpanded) {
      setNoticeExpanded(true);
      return;
    }
    setNoticeExpanded(false);
    const recipient = String(friendName || "").toLowerCase();
    if (["fungfung", "manman"].includes(recipient)) {
      try {
        await supabaseClient.from("user_notifications")
          .update({ is_read: true })
          .eq("recipient_username", recipient)
          .eq("is_read", false);
      } catch (_) {}
    }
    if (notice) notice.textContent = "";
    showNotificationBadge(false);
  });

  // 通知每次重新載入時預設收起，只有按紅點才顯示。
  const originalCheckNotifications = window.checkFungfungNotifications;
  if (typeof originalCheckNotifications === "function") {
    window.checkFungfungNotifications = async function (...args) {
      const result = await originalCheckNotifications.apply(this, args);
      setNoticeExpanded(false);
      return result;
    };
  }
  if (notice && !notice.textContent.trim()) setNoticeExpanded(false);

  const disc = document.getElementById("cover");
  if (!disc || !audio) return;
  let pointerDown = false;
  let moved = false;
  let suppressClick = false;
  let lastAngle = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;

  function angleAt(event) {
    const rect = disc.getBoundingClientRect();
    return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
  }
  function normalizedDelta(delta) {
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    return delta;
  }

  disc.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    moved = false;
    suppressClick = false;
    lastAngle = angleAt(event);
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    disc.classList.add("disc-dragging");
    disc.setPointerCapture?.(event.pointerId);
  });
  disc.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    const distance = Math.hypot(event.clientX - lastPointerX, event.clientY - lastPointerY);
    const delta = normalizedDelta(angleAt(event) - lastAngle);
    if (distance > 6) moved = true;
    if (Math.abs(delta) > 0.015) {
      const seconds = Math.max(1, Math.round(Math.abs(delta) * 16));
      audio.currentTime = Math.max(0, Math.min(audio.duration || Infinity, audio.currentTime + (delta > 0 ? seconds : -seconds)));
      suppressClick = true;
    }
    lastAngle = angleAt(event);
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  });
  function finishDiscPointer(event) {
    if (!pointerDown) return;
    pointerDown = false;
    disc.classList.remove("disc-dragging");
    disc.releasePointerCapture?.(event.pointerId);
  }
  disc.addEventListener("pointerup", finishDiscPointer);
  disc.addEventListener("pointercancel", finishDiscPointer);
  disc.addEventListener("click", (event) => {
    if (suppressClick || moved) {
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
      return;
    }
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  });
})();


/* 唱片圖像跟隨手勢旋轉：順時針加角度，逆時針減角度 */
(function syncDiscImageWithGesture() {
  const disc = document.getElementById("cover");
  if (!disc) return;
  let dragging = false;
  let previousAngle = 0;
  let gestureRotation = Number(disc.dataset.gestureRotation || 0);
  function getAngle(event) {
    const rect = disc.getBoundingClientRect();
    return Math.atan2(event.clientY - (rect.top + rect.height / 2), event.clientX - (rect.left + rect.width / 2));
  }
  function deltaAngle(value) {
    while (value > Math.PI) value -= Math.PI * 2;
    while (value < -Math.PI) value += Math.PI * 2;
    return value;
  }
  function updateRotation() {
    disc.dataset.gestureRotation = String(gestureRotation);
    disc.style.setProperty("--gesture-rotation", `${gestureRotation}deg`);
  }
  disc.addEventListener("pointerdown", (event) => {
    dragging = true;
    previousAngle = getAngle(event);
    gestureRotation = Number(disc.dataset.gestureRotation || gestureRotation || 0);
    updateRotation();
  });
  disc.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const currentAngle = getAngle(event);
    gestureRotation += deltaAngle(currentAngle - previousAngle) * 180 / Math.PI;
    previousAngle = currentAngle;
    updateRotation();
  });
  const endDrag = () => { dragging = false; };
  disc.addEventListener("pointerup", endDrag);
  disc.addEventListener("pointercancel", endDrag);
  updateRotation();
})();


/* 統一唱片旋轉與 audio 播放狀態 */
(function syncDiscAnimationWithAudio() {
  const disc = document.getElementById("cover");
  const cdElement = typeof cd !== "undefined" ? cd : disc;
  if (!audio || !disc) return;
  const setDiscPlaying = (playing) => {
    disc.style.animationPlayState = playing ? "running" : "paused";
    if (cdElement) cdElement.style.animationPlayState = playing ? "running" : "paused";
    disc.classList.toggle("is-playing", playing);
  };
  audio.addEventListener("play", () => setDiscPlaying(true));
  audio.addEventListener("playing", () => setDiscPlaying(true));
  audio.addEventListener("pause", () => setDiscPlaying(false));
  audio.addEventListener("ended", () => setDiscPlaying(false));
  setDiscPlaying(!audio.paused && !audio.ended);
})();


/* 歌曲事件通知：fungfung 收到所有歌曲事件；manman 收到敏敏／安眠歌單事件 */
async function notifySongEventRecipients(kind, songKey, detail) {
  const actor = String(friendName || "").toLowerCase();
  const song = songsData.find(item => item.src === songKey);
  if (!song) return;
  const recipients = new Set(["fungfung"]);
  if (song.cat === "man" || song.cat === "manman") recipients.add("manman");
  const songName = song.name;
  const rows = [...recipients]
    .filter(recipient => recipient !== actor)
    .map(recipient => ({
      recipient_username: recipient,
      kind,
      song_src: songKey,
      message: `${detail}（歌曲：${songName}）`,
      is_read: false
    }));
  if (!rows.length) return;
  try { await supabaseClient.from("user_notifications").insert(rows); } catch (_) {}
}
