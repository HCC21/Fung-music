/* ============================
   🎵 Supabase 初始化
============================ */
const SUPABASE_URL ="https://dzaemdhyvcgstidhvykn.supabase.co";
const SUPABASE_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YWVtZGh5dmNnc3RpZGh2eWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzgyMDMsImV4cCI6MjA4NzE1NDIwM30.Rx6vmN3QPnF4vxKIQt6Okid6SYmwrGfyCpom1KtaEo8";
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* ============================
   ⭐ 白名單 + 固定 3 位數字密碼
============================ */
const USERS = {
    "fungfung": "678",
    "Manman": "107",
    "莉莉": "123",
    "271": "271",
    "jackie": "173",
    "Jason Tang": "021",
    "Dawn": "678",
    "Billy": "107",
    "Grace": "456",
    "Creamy": "578",
    "Yuen": "987",
    "Winnie": "777",
    "Cherry": "555",
    "星雲": "114",
    "Linda": "654",
    "Yuki": "871",
    "Vivien": "107",
    "Jen Jen": "111",
    "Joey": "678",
    "Monica": "222",
    "June": "112",
    "Tun": "113",
    "Ying": "127",
    "Mi": "121",



};

// ⭐ 管理員設定
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

/* ============================
   🎉 登入提示
============================ */
function showWelcomePopup(name) {
    welcomePopupText.textContent = `🎉 歡迎你，${name}！`;
    welcomePopup.style.display = "flex";
    setTimeout(() => welcomePopup.style.display = "none", 2500);
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
   ⭐ Supabase：儲存登入紀錄
============================ */
async function saveLoginHistory(name) {
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
                last_login: new Date().toLocaleString()
            })
            .eq("name", name);
    } else {
        await supabase
            .from("login_history")
            .insert({
                name: name,
                count: 1,
                last_login: new Date().toLocaleString()
            });
    }
}

/* ============================
   ⭐ 顯示自己登入紀錄
============================ */
async function showLoginHistory(name) {
    const historyList = document.getElementById("login-history");

    let query = supabase.from("login_history").select("*");

    // ⭐ 管理員顯示全部
    if (name !== ADMIN_NAME) {
        query = query.eq("name", name);
    }

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
        text.innerHTML = `
            <strong>${friend.name}</strong><br>
            <small>登入 ${friend.count} 次</small><br>
            <small>最後登入：${friend.last_login}</small>
        `;

        li.appendChild(avatar);
        li.appendChild(text);
        historyList.appendChild(li);
    });
}
/* ============================
   ⭐ 管理員：顯示全部登入紀錄
============================ */
async function loadAdminHistory() {
    const list = document.getElementById("admin-history-list");

    const { data: history } = await supabase
        .from("login_history")
        .select("*")
        .order("count", { ascending: false });

    list.innerHTML = "";

    history.forEach(friend => {
        const li = document.createElement("li");
        li.innerHTML = `
    ${friend.name} — 登入 ${friend.count} 次（最後：${friend.last_login}）
    <button class="delete-login" data-name="${friend.name}">刪除</button>
`;
        list.appendChild(li);
    });
}

/* ============================
   ⭐ 開啟管理員後台
============================ */
function openAdminPanel() {
    adminPanel.style.display = "block";

    const list = document.getElementById("admin-user-list");
    list.innerHTML = "";

    for (const name in USERS) {
        const li = document.createElement("li");
        li.textContent = `${name} — 密碼：${USERS[name]}`;
        list.appendChild(li);
    }

    loadAdminHistory();
}
document.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-login")) {
        const name = e.target.dataset.name;

        if (!confirm(`確定要刪除 ${name} 的登入紀錄？`)) return;

        await supabase
            .from("login_history")
            .delete()
            .eq("name", name);

        loadAdminHistory(); // 重新載入
    }
});
adminBtn.addEventListener("click", () => {
    if (adminPasswordInput.value !== ADMIN_PASSWORD) {
        alert("管理員密碼錯誤！");
        return;
    }
    openAdminPanel();
});

adminClose.addEventListener("click", () => {
    adminPanel.style.display = "none";
});
document.getElementById("add-user-btn").addEventListener("click", () => {
    const newName = document.getElementById("new-user-name").value.trim();
    const newPass = document.getElementById("new-user-pass").value.trim();

    if (!newName || !newPass) {
        alert("請輸入名字和密碼！");
        return;
    }

    if (USERS[newName]) {
        alert("此用戶已存在！");
        return;
    }

    if (newPass.length !== 3) {
        alert("密碼必須是 3 位數字！");
        return;
    }

    USERS[newName] = newPass;

    alert(`成功新增：${newName}`);

    document.getElementById("new-user-name").value = "";
    document.getElementById("new-user-pass").value = "";

    openAdminPanel(); // 重新載入白名單
});

/* ============================
   ⭐ 登入按鈕（白名單 + 密碼）
============================ */
loginBtn.addEventListener("click", async () => {
    const name = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!USERS[name]) {
        alert("❌ 此名字未被授權登入！");
        return;
    }

    if (USERS[name] !== password) {
        alert("❌ 密碼錯誤！");
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

if (name === ADMIN_NAME) {
    loadAdminHistory();   // ⭐ 管理員登入後顯示全部朋友紀錄
}

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
});

/* ============================
   ⭐ 自動登入（禁用）
============================ */
window.addEventListener("load", () => {
    localStorage.removeItem("friendName");
});

/* ============================
   🎵 生成 Playlist
============================ */
let currentIndex = -1;
let songs = [];

function generatePlaylist() {
    playlist.innerHTML = "";
    songsData.forEach((song, index) => {
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

    playlist.innerHTML = "";

    songsData
        .filter(song => song.name.toLowerCase().includes(keyword))
        .forEach((song, index) => {
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

    playlist.innerHTML = "";

    songsData
        .filter(song => selectedCat === "all" || song.cat === selectedCat)
        .forEach((song, index) => {
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
}

playlist.addEventListener("click", e => {
    if (e.target.tagName === "LI") {
        playSong(parseInt(e.target.dataset.index));
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
    playSong((currentIndex + 1) % songs.length);
});

prevBtn.addEventListener("click", () => {
    playSong((currentIndex - 1 + songs.length) % songs.length);
});

audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;

    progress.value = (audio.currentTime / audio.duration) * 100;
    currentTimeText.textContent = formatTime(audio.currentTime);
    durationText.textContent = formatTime(audio.duration);
});

progress.addEventListener("input", () => {
    audio.currentTime = (progress.value / 100) * audio.duration;
});

function formatTime(sec) {
    if (isNaN(sec)) return "0:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}
