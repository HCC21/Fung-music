// ============================
// 🎵 Supabase 初始化
// ============================
const SUPABASE_URL = "你的 dzaemdhyvcgstidhvykn";
const SUPABASE_KEY = "你的 sb_publishable_3gIDryVQCMi354alWvutiw_1xqRGU67";

/* ============================
   🎵 Supabase 初始化
============================ */
const SUPABASE_URL = "你的 dzaemdhyvcgstidhvykn";
const SUPABASE_KEY = "你的 sb_publishable_3gIDryVQCMi354alWvutiw_1xqRGU67";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* ============================
   🎵 朋友登入系統
============================ */
const loginScreen = document.getElementById("login-screen");
const loginBtn = document.getElementById("login-btn");
const usernameInput = document.getElementById("username-input");
const welcomeText = document.getElementById("welcome-text");

const welcomePopup = document.getElementById("welcome-popup");
const welcomePopupText = document.getElementById("welcome-popup-text");

// 顯示登入提示
function showWelcomePopup(name) {
    welcomePopupText.textContent = `🎉 歡迎你，${name}！`;
    welcomePopup.style.display = "flex";

    setTimeout(() => {
        welcomePopup.style.display = "none";
    }, 2500);
}

// 生成頭像顏色
function generateAvatar(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
}

// ⭐ Supabase：儲存登入紀錄
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

// ⭐ Supabase：讀取登入紀錄
async function showLoginHistory() {
    const historyList = document.getElementById("login-history");

    const { data: history } = await supabase
        .from("login_history")
        .select("*")
        .order("count", { ascending: false });

    historyList.innerHTML = "";

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

// 自動登入
window.addEventListener("load", async () => {
    const savedName = localStorage.getItem("friendName");
    if (savedName) {
        loginScreen.style.display = "none";
        welcomeText.textContent = `🎵 歡迎你，${savedName}`;

        await saveLoginHistory(savedName);
        await showLoginHistory();

        setTimeout(() => showWelcomePopup(savedName), 500);
    } else {
        await showLoginHistory();
    }
});

// 按下登入
loginBtn.addEventListener("click", async () => {
    const name = usernameInput.value.trim();
    if (name.length === 0) return;

    localStorage.setItem("friendName", name);
    welcomeText.textContent = `🎵 歡迎你，${name}`;

    loginScreen.classList.add("fade-out");
    setTimeout(() => (loginScreen.style.display = "none"), 600);

    await saveLoginHistory(name);
    await showLoginHistory();

    setTimeout(() => showWelcomePopup(name), 700);
});


/* ============================
   🎵 播放器元素
============================ */
const audio = document.getElementById("audio");
const title = document.getElementById("title");
const cover = document.getElementById("cover");
const playlist = document.getElementById("playlist");
const categories = document.getElementById("categories");
const bg = document.getElementById("bg");

const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const progress = document.getElementById("progress");
const currentTimeText = document.getElementById("current");
const durationText = document.getElementById("duration");
const searchBox = document.getElementById("search");

let currentIndex = -1;
let songs = [];


/* ============================
   🎵 自動生成 Playlist
============================ */
const songsData = [
    { name: "一千個願意", src: "music/一千個願意.mp3", cover: "covers/cover9.jpg", cat: "slow songs" },
    { name: "遲來的春天", src: "music/遲來的春天.mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "感情的段落", src: "music/感情的段落.mp3", cover: "covers/cover1.jpg", cat: "female" },
    { name: "愛情是一種法國甜品", src: "music/愛情是一種法國甜品.mp3", cover: "covers/cover6.jpg", cat: "female" },
    { name: "痛哭", src: "music/痛哭.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "最後的信仰", src: "music/最後的信仰.mp3", cover: "covers/cover5.jpg", cat: "female" },
    { name: "雪中情", src: "music/雪中情.mp3", cover: "covers/cover8.jpg", cat: "slow songs" },
    { name: "迷戀", src: "music/迷戀.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "記得", src: "music/記得.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "真情流露", src: "music/真情流露.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "相對無言", src: "music/相對無言.mp3", cover: "covers/cover4.jpg", cat: "slow songs" },
    { name: "為何仍剩我一人", src: "music/為何仍剩我一人.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "柔情蜜意", src: "music/柔情蜜意.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "明目張膽", src: "music/明目張膽.mp3", cover: "covers/cover3.jpg", cat: "female" },
    { name: "我是你未來", src: "music/我是你未來.mp3", cover: "covers/cover7.jpg", cat: "slow songs" },
    { name: "吻感", src: "music/吻感.mp3", cover: "covers/cover6.jpg", cat: "slow songs" },
    { name: "你狠心來傷我嗎", src: "music/你狠心來傷我嗎.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "再渡艷陽天", src: "music/再渡艷陽天.mp3", cover: "covers/cover2.jpg", cat: "female" },
    { name: "心有獨鍾(鋼琴版)", src: "music/心有獨鍾(鋼琴版).mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "不要哭了", src: "music/不要哭了.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "千年女王", src: "music/千年女王.mp3", cover: "covers/cover3.jpg", cat: "kids" },
    { name: "千年女王(傳說)", src: "music/千年女王(傳說).mp3", cover: "covers/cover5.jpg", cat: "kids" },
    { name: "飄零燕", src: "music/飄零燕.mp3", cover: "covers/cover8.jpg", cat: "kids" },
    { name: "1874", src: "music/1874.mp3", cover: "covers/cover5.jpg", cat: "slow songs" },
    { name: "Sol4", src: "music/Sol4.mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "一憶三千八天", src: "music/一憶三千八天.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "不見不散", src: "music/不見不散.mp3", cover: "covers/cover4.jpg", cat: "slow songs" },
    { name: "你給我自信", src: "music/你給我自信.mp3", cover: "covers/cover1.jpg", cat: "fast songs" },
    { name: "告訴我你會在夢境中等我", src: "music/告訴我你會在夢境中等我.mp3", cover: "covers/cover7.jpg", cat: "slow songs" },
    { name: "我心不死", src: "music/我心不死.mp3", cover: "covers/cover2.jpg", cat: "female" },
    { name: "我的親愛還是你", src: "music/我的親愛還是你.mp3", cover: "covers/cover6.jpg", cat: "slow songs" },
    { name: "我這樣愛你", src: "music/我這樣愛你.mp3", cover: "covers/cover7.jpg", cat: "slow songs" },
    { name: "我愛玫瑰園", src: "music/我愛玫瑰園.mp3", cover: "covers/cover8.jpg", cat: "fast songs" },
    { name: "沒有你的愛", src: "music/沒有你的愛.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "初戀", src: "music/初戀.mp3", cover: "covers/cover5.jpg", cat: "female" },
    { name: "送曲送給你", src: "music/送曲送給你.mp3", cover: "covers/cover7.jpg", cat: "slow songs" },
    { name: "送你一瓣的雪花", src: "music/送你一瓣的雪花.mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "假的戀愛", src: "music/假的戀愛.mp3", cover: "covers/cover4.jpg", cat: "female" },
    { name: "富士山下", src: "music/富士山下.mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "棉胎", src: "music/棉胎.mp3", cover: "covers/cover6.jpg", cat: "female" },
    { name: "無心快語", src: "music/無心快語.mp3", cover: "covers/cover7.jpg", cat: "fast songs" },
    { name: "給自己的情書", src: "music/給自己的情書.mp3", cover: "covers/cover4.jpg", cat: "female" },
    { name: "媽咪與天父", src: "music/媽咪與天父.mp3", cover: "covers/cover8.jpg", cat: "festival" },
    { name: "暸解你的所有", src: "music/暸解你的所有.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "離開請關燈", src: "music/離開請關燈.mp3", cover: "covers/cover3.jpg", cat: "female" },
    { name: "魔法奇緣之媽媽知道", src: "music/魔法奇緣之媽媽知道.mp3", cover: "covers/cover5.jpg", cat: "kids" }
];

// 生成 playlist
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
   🎵 播放功能
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

    bg.style.backgroundImage = `url(${item.dataset.cover})`;

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
        playBtn.classList.add("playing");
    } else {
        audio.pause();
        cover.style.animationPlayState = "paused";
        playBtn.textContent = "▶️";
        playBtn.classList.remove("playing");
    }
});

nextBtn.addEventListener("click", () => {
    playSong((currentIndex + 1) % songs.length);
});

prevBtn.addEventListener("click", () => {
    playSong((currentIndex - 1 + songs.length) % songs.length);
});

audio.addEventListener("ended", () => nextBtn.click());


/* ============================
   🎵 搜尋功能
============================ */
searchBox.addEventListener("input", () => {
    const keyword = searchBox.value.toLowerCase();

    songs.forEach(li => {
        const name = li.textContent.toLowerCase();
        li.style.display = name.includes(keyword) ? "block" : "none";
    });
});


/* ============================
   🎵 分類功能
============================ */
categories.addEventListener("click", e => {
    if (e.target.tagName !== "LI") return;

    const cat = e.target.dataset.cat;

    songs.forEach(song => {
        song.style.display =
            cat === "all" || song.dataset.cat === cat ? "block" : "none";
    });
});


/* ============================
   🎵 進度條
============================ */
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
}/* ============================
   🎵 Supabase 初始化
============================ */
const SUPABASE_URL = "你的 Supabase URL";
const SUPABASE_KEY = "你的 anon public key";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


/* ============================
   🎵 朋友登入系統
============================ */
const loginScreen = document.getElementById("login-screen");
const loginBtn = document.getElementById("login-btn");
const usernameInput = document.getElementById("username-input");
const welcomeText = document.getElementById("welcome-text");

const welcomePopup = document.getElementById("welcome-popup");
const welcomePopupText = document.getElementById("welcome-popup-text");

// 顯示登入提示
function showWelcomePopup(name) {
    welcomePopupText.textContent = `🎉 歡迎你，${name}！`;
    welcomePopup.style.display = "flex";

    setTimeout(() => {
        welcomePopup.style.display = "none";
    }, 2500);
}

// 生成頭像顏色
function generateAvatar(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 50%)`;
}

// ⭐ Supabase：儲存登入紀錄
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

// ⭐ Supabase：讀取登入紀錄
async function showLoginHistory() {
    const historyList = document.getElementById("login-history");

    const { data: history } = await supabase
        .from("login_history")
        .select("*")
        .order("count", { ascending: false });

    historyList.innerHTML = "";

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

// 自動登入
window.addEventListener("load", async () => {
    const savedName = localStorage.getItem("friendName");
    if (savedName) {
        loginScreen.style.display = "none";
        welcomeText.textContent = `🎵 歡迎你，${savedName}`;

        await saveLoginHistory(savedName);
        await showLoginHistory();

        setTimeout(() => showWelcomePopup(savedName), 500);
    } else {
        await showLoginHistory();
    }
});

// 按下登入
loginBtn.addEventListener("click", async () => {
    const name = usernameInput.value.trim();
    if (name.length === 0) return;

    localStorage.setItem("friendName", name);
    welcomeText.textContent = `🎵 歡迎你，${name}`;

    loginScreen.classList.add("fade-out");
    setTimeout(() => (loginScreen.style.display = "none"), 600);

    await saveLoginHistory(name);
    await showLoginHistory();

    setTimeout(() => showWelcomePopup(name), 700);
});


/* ============================
   🎵 播放器元素
============================ */
const audio = document.getElementById("audio");
const title = document.getElementById("title");
const cover = document.getElementById("cover");
const playlist = document.getElementById("playlist");
const categories = document.getElementById("categories");
const bg = document.getElementById("bg");

const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const progress = document.getElementById("progress");
const currentTimeText = document.getElementById("current");
const durationText = document.getElementById("duration");
const searchBox = document.getElementById("search");

let currentIndex = -1;
let songs = [];


/* ============================
   🎵 自動生成 Playlist
============================ */
const songsData = [
    { name: "一千個願意", src: "music/一千個願意.mp3", cover: "covers/cover9.jpg", cat: "slow songs" },
    { name: "遲來的春天", src: "music/遲來的春天.mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "感情的段落", src: "music/感情的段落.mp3", cover: "covers/cover1.jpg", cat: "female" },
    { name: "愛情是一種法國甜品", src: "music/愛情是一種法國甜品.mp3", cover: "covers/cover6.jpg", cat: "female" },
    { name: "痛哭", src: "music/痛哭.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "最後的信仰", src: "music/最後的信仰.mp3", cover: "covers/cover5.jpg", cat: "female" },
    { name: "雪中情", src: "music/雪中情.mp3", cover: "covers/cover8.jpg", cat: "slow songs" },
    { name: "迷戀", src: "music/迷戀.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "記得", src: "music/記得.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "真情流露", src: "music/真情流露.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "相對無言", src: "music/相對無言.mp3", cover: "covers/cover4.jpg", cat: "slow songs" },
    { name: "為何仍剩我一人", src: "music/為何仍剩我一人.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "柔情蜜意", src: "music/柔情蜜意.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "明目張膽", src: "music/明目張膽.mp3", cover: "covers/cover3.jpg", cat: "female" },
    { name: "我是你未來", src: "music/我是你未來.mp3", cover: "covers/cover7.jpg", cat: "slow songs" },
    { name: "吻感", src: "music/吻感.mp3", cover: "covers/cover6.jpg", cat: "slow songs" },
    { name: "你狠心來傷我嗎", src: "music/你狠心來傷我嗎.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "再渡艷陽天", src: "music/再渡艷陽天.mp3", cover: "covers/cover2.jpg", cat: "female" },
    { name: "心有獨鍾(鋼琴版)", src: "music/心有獨鍾(鋼琴版).mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "不要哭了", src: "music/不要哭了.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "千年女王", src: "music/千年女王.mp3", cover: "covers/cover3.jpg", cat: "kids" },
    { name: "千年女王(傳說)", src: "music/千年女王(傳說).mp3", cover: "covers/cover5.jpg", cat: "kids" },
    { name: "飄零燕", src: "music/飄零燕.mp3", cover: "covers/cover8.jpg", cat: "kids" },
    { name: "1874", src: "music/1874.mp3", cover: "covers/cover5.jpg", cat: "slow songs" },
    { name: "Sol4", src: "music/Sol4.mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "一憶三千八天", src: "music/一憶三千八天.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "不見不散", src: "music/不見不散.mp3", cover: "covers/cover4.jpg", cat: "slow songs" },
    { name: "你給我自信", src: "music/你給我自信.mp3", cover: "covers/cover1.jpg", cat: "fast songs" },
    { name: "告訴我你會在夢境中等我", src: "music/告訴我你會在夢境中等我.mp3", cover: "covers/cover7.jpg", cat: "slow songs" },
    { name: "我心不死", src: "music/我心不死.mp3", cover: "covers/cover2.jpg", cat: "female" },
    { name: "我的親愛還是你", src: "music/我的親愛還是你.mp3", cover: "covers/cover6.jpg", cat: "slow songs" },
    { name: "我這樣愛你", src: "music/我這樣愛你.mp3", cover: "covers/cover7.jpg", cat: "slow songs" },
    { name: "我愛玫瑰園", src: "music/我愛玫瑰園.mp3", cover: "covers/cover8.jpg", cat: "fast songs" },
    { name: "沒有你的愛", src: "music/沒有你的愛.mp3", cover: "covers/cover1.jpg", cat: "slow songs" },
    { name: "初戀", src: "music/初戀.mp3", cover: "covers/cover5.jpg", cat: "female" },
    { name: "送曲送給你", src: "music/送曲送給你.mp3", cover: "covers/cover7.jpg", cat: "slow songs" },
    { name: "送你一瓣的雪花", src: "music/送你一瓣的雪花.mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "假的戀愛", src: "music/假的戀愛.mp3", cover: "covers/cover4.jpg", cat: "female" },
    { name: "富士山下", src: "music/富士山下.mp3", cover: "covers/cover3.jpg", cat: "slow songs" },
    { name: "棉胎", src: "music/棉胎.mp3", cover: "covers/cover6.jpg", cat: "female" },
    { name: "無心快語", src: "music/無心快語.mp3", cover: "covers/cover7.jpg", cat: "fast songs" },
    { name: "給自己的情書", src: "music/給自己的情書.mp3", cover: "covers/cover4.jpg", cat: "female" },
    { name: "媽咪與天父", src: "music/媽咪與天父.mp3", cover: "covers/cover8.jpg", cat: "festival" },
    { name: "暸解你的所有", src: "music/暸解你的所有.mp3", cover: "covers/cover2.jpg", cat: "slow songs" },
    { name: "離開請關燈", src: "music/離開請關燈.mp3", cover: "covers/cover3.jpg", cat: "female" },
    { name: "魔法奇緣之媽媽知道", src: "music/魔法奇緣之媽媽知道.mp3", cover: "covers/cover5.jpg", cat: "kids" }
];

// 生成 playlist
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
   🎵 播放功能
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

    bg.style.backgroundImage = `url(${item.dataset.cover})`;

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
        playBtn.classList.add("playing");
    } else {
        audio.pause();
        cover.style.animationPlayState = "paused";
        playBtn.textContent = "▶️";
        playBtn.classList.remove("playing");
    }
});

nextBtn.addEventListener("click", () => {
    playSong((currentIndex + 1) % songs.length);
});

prevBtn.addEventListener("click", () => {
    playSong((currentIndex - 1 + songs.length) % songs.length);
});

audio.addEventListener("ended", () => nextBtn.click());


/* ============================
   🎵 搜尋功能
============================ */
searchBox.addEventListener("input", () => {
    const keyword = searchBox.value.toLowerCase();

    songs.forEach(li => {
        const name = li.textContent.toLowerCase();
        li.style.display = name.includes(keyword) ? "block" : "none";
    });
});


/* ============================
   🎵 分類功能
============================ */
categories.addEventListener("click", e => {
    if (e.target.tagName !== "LI") return;

    const cat = e.target.dataset.cat;

    songs.forEach(song => {
        song.style.display =
            cat === "all" || song.dataset.cat === cat ? "block" : "none";
    });
});


/* ============================
   🎵 進度條
============================ */
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