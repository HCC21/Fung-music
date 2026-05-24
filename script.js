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
   🎵 DOM 元素（完整版本）
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

const commentList = document.getElementById("comment-list");
const commentInput = document.getElementById("comment-input");
const commentSubmit = document.getElementById("comment-submit");

const gameModal = document.getElementById("game-modal");
const gameClose = document.getElementById("game-close");
const gameCanvas = document.getElementById("game-canvas");
const gameUI = document.getElementById("game-ui");

const gameSakura = document.getElementById("game-sakura");
const gameCartoon = document.getElementById("game-cartoon");

const themeSelect = document.getElementById("theme-select");

const loginHistoryList = document.getElementById("login-history");
const adminUserList = document.getElementById("admin-user-list");
const adminHistoryList = document.getElementById("admin-history-list");

/* ⭐ 上載歌曲用 DOM */
const songNameInput = document.getElementById("song-name");
const songCatInput = document.getElementById("song-cat");
const songAllowedInput = document.getElementById("song-allowed");
const songFileInput = document.getElementById("song-file");
const coverFileInput = document.getElementById("cover-file");

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
   ⭐ 儲存登入紀錄（使用 ISO 時間）
============================ */
async function saveLoginHistory(name) {
    const nowISO = new Date().toISOString();

    const { data: existing } = await supabase
        .from("login_history")
        .select("*")
        .eq("name", name)
        .single();

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
   🔔 通知系統（fungfung 未讀留言）
============================ */
async function checkNotifications() {
    const currentUser = (localStorage.getItem("friendName") || "").trim().toLowerCase();
    if (currentUser !== ADMIN_NAME) {
        adminNotice.style.display = "none";
        return;
    }

    const { data } = await supabase
        .from("comments")
        .select("id")
        .eq("isRead", false);

    adminNotice.style.display = data && data.length > 0 ? "block" : "none";
}
setInterval(checkNotifications, 5000);

async function markAllRead() {
    const currentUser = (localStorage.getItem("friendName") || "").trim().toLowerCase();
    if (currentUser !== ADMIN_NAME) return;

    await supabase.from("comments").update({ isRead: true }).eq("isRead", false);
    adminNotice.style.display = "none";
}

/* ============================
   ⭐ 顯示登入紀錄（側邊欄，最近 30 天）
============================ */
async function showLoginHistory(name) {
    const historyList = document.getElementById("login-history");

    let oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    let query = supabase
        .from("login_history")
        .select("*")
        .gte("last_login", oneMonthAgo.toISOString());

    if (name !== ADMIN_NAME) query = query.eq("name", name);

    const { data: history } = await query.order("last_login", { ascending: false });

    historyList.innerHTML = "";

    if (!history || history.length === 0) {
        historyList.innerHTML = "<li>暫時沒有登入紀錄</li>";
        return;
    }

    history.forEach(friend => {
        const li = document.createElement("li");

        const avatar = document.createElement("div");
        avatar.className = "friend-avatar";
        avatar.style.background = generateAvatar(friend.name);

        const text = document.createElement("div");
        const lastLoginText = friend.last_login
            ? new Date(friend.last_login).toLocaleString()
            : friend.last_login;

        text.innerHTML = `
            <strong>${friend.name}</strong><br>
            <small>登入 ${friend.count} 次</small><br>
            <small>最後登入：${lastLoginText}</small>
        `;

        li.appendChild(avatar);
        li.appendChild(text);
        historyList.appendChild(li);
    });
}

/* ============================
   ⭐ 管理員：顯示全部登入紀錄（最近 30 天）
============================ */
async function loadAdminHistory() {
    const list = document.getElementById("admin-history-list");

    let oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

    const { data: history } = await supabase
        .from("login_history")
        .select("*")
        .gte("last_login", oneMonthAgo.toISOString())
        .order("count", { ascending: false });

    list.innerHTML = "";

    if (!history) return;

    history.forEach(friend => {
        const lastLoginText = friend.last_login
            ? new Date(friend.last_login).toLocaleString()
            : friend.last_login;

        const li = document.createElement("li");
        li.textContent = `${friend.name} — 登入 ${friend.count} 次（最後：${lastLoginText}）`;
        list.appendChild(li);
    });
}

/* ============================
   ⭐ 開啟管理員後台
============================ */
async function openAdminPanel() {
    adminPanel.style.display = "block";

    adminUserList.innerHTML = "";
    const { data: users } = await supabase
        .from("users")
        .select("*")
        .order("name");

    if (users) {
        users.forEach(u => {
            const li = document.createElement("li");
            li.textContent = `${u.name} — 密碼：${u.password}`;
            adminUserList.appendChild(li);
        });
    }

    await loadAdminHistory();
    await markAllRead();
}

/* ============================
   ⭐ 新增帳號
============================ */
document.getElementById("add-user-btn").addEventListener("click", async () => {
    const newName = document.getElementById("new-user-name").value.trim();
    const newPass = document.getElementById("new-user-pass").value.trim();

    if (!newName || !newPass) return alert("請輸入名字和密碼！");
    if (newPass.length !== 3) return alert("密碼必須是 3 位數字！");

    const { error } = await supabase.from("users").insert({
        name: newName,
        password: newPass
    });

    if (error) return alert("新增失敗，可能用戶已存在！");

    alert(`成功新增：${newName}`);
    openAdminPanel();
});

/* ============================
   ⭐ 上載歌曲（mp3 + 封面）
============================ */
async function uploadSong() {
    const name = songNameInput.value.trim();
    const cat = songCatInput.value.trim();
    const allowed = songAllowedInput.value.trim().toLowerCase().split(",");

    const mp3File = songFileInput.files[0];
    const coverFile = coverFileInput.files[0];

    if (!name || !mp3File || !coverFile) {
        alert("請輸入歌曲名稱、MP3、封面！");
        return;
    }

    const { data: mp3Data, error: mp3Err } = await supabase.storage
        .from("songs")
        .upload(`mp3/${Date.now()}-${mp3File.name}`, mp3File);

    if (mp3Err) return alert("MP3 上載失敗");

    const { data: coverData, error: coverErr } = await supabase.storage
        .from("covers")
        .upload(`img/${Date.now()}-${coverFile.name}`, coverFile);

    if (coverErr) return alert("封面上載失敗");

    const mp3Url = supabase.storage.from("songs").getPublicUrl(mp3Data.path).data.publicUrl;
    const coverUrl = supabase.storage.from("covers").getPublicUrl(coverData.path).data.publicUrl;

    await supabase.from("songs").insert({
        name: name,
        src: mp3Url,
        cover: coverUrl,
        cat: cat,
        allowedUsers: allowed.length === 1 && allowed[0] === "" ? "all" : allowed
    });

    alert("歌曲新增成功！");
    songNameInput.value = "";
    songCatInput.value = "";
    songAllowedInput.value = "";
    songFileInput.value = "";
    coverFileInput.value = "";
}

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

    if (error || !user) return alert("❌ 名字或密碼錯誤！");

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

    if (name === ADMIN_NAME) await loadAdminHistory();

    generatePlaylist(true);
    showWelcomePopup(name);
});

/* ============================
   ⭐ 管理員登入 / 關閉後台
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

    loginHistoryList.innerHTML = "";
    adminNotice.style.display = "none";
});

/* ============================
   🎵 Playlist（Supabase + 分頁）
============================ */
let currentIndex = -1;
let songs = [];

let allSongsDB = [];
let page = 1;
const PAGE_SIZE = 10;

async function generatePlaylist(reset = true) {
    const currentUser = (localStorage.getItem("friendName") || "")
        .trim()
        .toLowerCase();

    if (reset) {
        playlist.innerHTML = "";
        page = 1;
        allSongsDB = [];
    }

    if (allSongsDB.length === 0) {
        const { data: songsDB, error } = await supabase
            .from("songs")
            .select("*")
            .order("id");

        if (error || !songsDB) {
            console.error("讀取歌曲失敗", error);
            return;
        }

        allSongsDB = songsDB;
    }

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageSongs = allSongsDB.slice(start, end);

    pageSongs.forEach(song => {
        let canListen = false;

        if (song.allowedUsers === "all" || song.allowedUsers === null) {
            canListen = true;
        } else if (Array.isArray(song.allowedUsers)) {
            const allowed = song.allowedUsers.map(u => (u || "").toLowerCase());
            if (allowed.includes(currentUser)) canListen = true;
        }

        if (!canListen) return;

        const li = document.createElement("li");
        li.textContent = song.name;
        li.dataset.src = song.src;
        li.dataset.cover = song.cover;
        li.dataset.cat = song.cat || "other";

        const visibleIndex = playlist.querySelectorAll("li").length;
        li.dataset.index = visibleIndex;

        playlist.appendChild(li);
    });

    songs = [...playlist.querySelectorAll("li")];
}

/* 向下滑到底載入更多 */
playlist.addEventListener("scroll", () => {
    if (playlist.scrollTop + playlist.clientHeight >= playlist.scrollHeight - 10) {
        const maxPage = Math.ceil(allSongsDB.length / PAGE_SIZE);
        if (page < maxPage) {
            page++;
            generatePlaylist(false);
        }
    }
});

/* ============================
   🔍 搜尋（保持簡單，不分頁）
============================ */
searchBox.addEventListener("input", async () => {
    const keyword = searchBox.value.trim().toLowerCase();
    const currentUser = (localStorage.getItem("friendName") || "")
        .trim()
        .toLowerCase();

    playlist.innerHTML = "";

    const { data: songsDB } = await supabase
        .from("songs")
        .select("*")
        .order("id");

    songsDB
        .filter(song => song.name.toLowerCase().includes(keyword))
        .forEach(song => {
            let canListen = false;

            if (song.allowedUsers === "all" || song.allowedUsers === null) {
                canListen = true;
            } else if (Array.isArray(song.allowedUsers)) {
                const allowed = song.allowedUsers.map(u => (u || "").toLowerCase());
                if (allowed.includes(currentUser)) canListen = true;
            }

            if (!canListen) return;

            const li = document.createElement("li");
            li.textContent = song.name;
            li.dataset.src = song.src;
            li.dataset.cover = song.cover;
            li.dataset.cat = song.cat || "other";

            const visibleIndex = playlist.querySelectorAll("li").length;
            li.dataset.index = visibleIndex;

            playlist.appendChild(li);
        });

    songs = [...playlist.querySelectorAll("li")];
});

/* ============================
   ⭐ 分類（保持簡單，不分頁）
============================ */
categories.addEventListener("click", async e => {
    if (e.target.tagName !== "LI") return;

    const selectedCat = e.target.dataset.cat;
    const currentUser = (localStorage.getItem("friendName") || "")
        .trim()
        .toLowerCase();

    playlist.innerHTML = "";

    const { data: songsDB } = await supabase
        .from("songs")
        .select("*")
        .order("id");

    songsDB
        .filter(song => selectedCat === "all" || song.cat === selectedCat)
        .forEach(song => {
            let canListen = false;

            if (song.allowedUsers === "all" || song.allowedUsers === null) {
                canListen = true;
            } else if (Array.isArray(song.allowedUsers)) {
                const allowed = song.allowedUsers.map(u => (u || "").toLowerCase());
                if (allowed.includes(currentUser)) canListen = true;
            }

            if (!canListen) return;

            const li = document.createElement("li");
            li.textContent = song.name;
            li.dataset.src = song.src;
            li.dataset.cover = song.cover;
            li.dataset.cat = song.cat || "other";

            const visibleIndex = playlist.querySelectorAll("li").length;
            li.dataset.index = visibleIndex;

            playlist.appendChild(li);
        });

    songs = [...playlist.querySelectorAll("li")];
});

/* ============================
   🎵 播放器
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

    if (currentUser === ADMIN_NAME) markAllRead();

    loadComments(item.textContent, currentUser);
}

playlist.addEventListener("click", e => {
    if (e.target.tagName === "LI") {
        const index = parseInt(e.target.dataset.index, 10);
        playSong(index);
    }
});

playBtn.addEventListener("click", () => {
    if (audio.paused) {
        audio.play();
        cover.style.animationPlayState = "running";
        playBtn.textContent = "⏸️";
        playBtn.classList.add("playing");
    } else {
        audio.pause();
        cover.style.animationPlayState = "paused";
        playBtn.textContent = "▶️";
        playBtn.classList.remove("playing");
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

    commentList.innerHTML = "";
    if (error || !comments) return;

    comments.forEach(c => {
        if (currentUser === ADMIN_NAME) {
            showComment(c);
            return;
        }

        if (!c.replyTo || c.replyTo === "") {
            if (c.user === currentUser) showComment(c);
            return;
        }

        if (c.replyTo === currentUser || c.user === currentUser) {
            showComment(c);
        }
    });
}

function showComment(c) {
    const li = document.createElement("li");

    const replyLabel = c.replyTo
        ? `<div class="reply-label">↳ 回覆 @${c.replyTo}</div>`
        : "";

    li.innerHTML = `
        ${replyLabel}
        <strong>${c.user}</strong>：${c.message}
        <br><small>${c.time}</small>
        <br><button class="reply-btn" data-user="${c.user}">回覆</button>
    `;

    commentList.appendChild(li);
}

document.addEventListener("click", e => {
    if (e.target.classList.contains("reply-btn")) {
        const replyUser = e.target.dataset.user;
        commentInput.value = `@${replyUser} `;
        commentInput.dataset.replyTo = replyUser;
        commentInput.focus();
    }
});

commentSubmit.addEventListener("click", async () => {
    const message = commentInput.value.trim();
    if (!message) return;

    const currentUser = (localStorage.getItem("friendName") || "")
        .trim()
        .toLowerCase();
    const songName = title.textContent;

    await supabase.from("comments").insert({
        songName: songName,
        user: currentUser,
        message: message,
        replyTo: commentInput.dataset.replyTo || null,
        isRead: false,
        time: new Date().toLocaleString()
    });

    commentInput.value = "";
    commentInput.dataset.replyTo = "";

    loadComments(songName, currentUser);
    checkNotifications();
});

/* ============================
   ⭐ 主題切換
============================ */
themeSelect.addEventListener("change", e => {
    document.body.className = e.target.value;
});

/* ============================
   ⭐ 遊戲事件重置
============================ */
function resetGameEvents() {
    document.onmousemove = null;
    document.onkeydown = null;

    gameCanvas.onclick = null;
    gameCanvas.ontouchmove = null;
    gameCanvas.ontouchstart = null;
}

/* ============================
   ⭐ 全局遊戲計時器
============================ */
let sakuraPetalTimer = null;
let sakuraTimer = null;
let cartoonObstacleTimer = null;

/* ============================
   ⭐ 打開 / 關閉 遊戲 modal
============================ */
function openGame() {
    gameModal.style.display = "flex";
}

gameClose.addEventListener("click", () => {
    gameModal.style.display = "none";

    const ctx = gameCanvas.getContext("2d");
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    gameUI.innerHTML = "";

    resetGameEvents();

    if (sakuraPetalTimer) clearInterval(sakuraPetalTimer);
    if (sakuraTimer) clearInterval(sakuraTimer);
    if (cartoonObstacleTimer) clearInterval(cartoonObstacleTimer);
});

/* ============================
   ⭐ 遊戲入口
============================ */
gameSakura.addEventListener("click", () => {
    openGame();
    startSakuraGame();
});

gameCartoon.addEventListener("click", () => {
    openGame();
    startCartoonGame();
});

/* ============================
   🌸 櫻花接花
============================ */
function startSakuraGame() {
    const canvas = gameCanvas;
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
            speed: 1 + Math.random() * 2
        });
    }

    document.onmousemove = e => {
        const rect = canvas.getBoundingClientRect();
        basketX = e.clientX - rect.left - 40;
    };

    canvas.ontouchmove = e => {
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
        gameUI.innerHTML = `分數：${score}｜剩餘時間：${timeLeft}s`;

        if (timeLeft <= 0) {
            gameRunning = false;
            clearInterval(sakuraTimer);
            clearInterval(sakuraPetalTimer);
            gameUI.innerHTML = `🎉 遊戲結束！你的分數：${score}`;
        }
    }, 1000);

    update();
}

/* ============================
   🎨 卡通跳跳樂
============================ */
function startCartoonGame() {
    const canvas = gameCanvas;
    const ctx = canvas.getContext("2d");

    canvas.width = 400;
    canvas.height = 400;

    let player = {
        x: 50,
        y: 300,
        width: 30,
        height: 30,
        dy: 0,
        jumping: false
    };

    let obstacles = [];
    let score = 0;
    let gameRunning = true;

    document.onkeydown = e => {
        if (e.code === "Space" && !player.jumping) {
            player.dy = -10;
            player.jumping = true;
        }
    };

    canvas.ontouchstart = e => {
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
            speed: 4
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
                gameUI.innerHTML = `💥 Game Over！分數：${score}`;
            }

            if (o.x + o.width < 0) {
                obstacles.splice(i, 1);
                score++;
            }
        });

        gameUI.innerHTML = `分數：${score}`;

        requestAnimationFrame(update);
    }

    update();
}

/* ============================
   ⭐ 初始化（頁面載入時檢查是否已登入）
============================ */
window.addEventListener("load", async () => {
    const stored = localStorage.getItem("friendName");
    if (stored) {
        const name = stored.trim();
        loginScreen.style.display = "none";
        welcomeText.textContent = `🎵 歡迎你，${name}`;

        if (name === ADMIN_NAME) {
            adminPasswordInput.style.display = "block";
            adminBtn.style.display = "block";
            await loadAdminHistory();
        }

        await showLoginHistory(name);
        await checkNotifications();
        generatePlaylist(true);
    } else {
        loginScreen.style.display = "flex";
    }
});
