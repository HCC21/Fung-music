// ============================
// Supabase 初始化
// ============================
const SUPABASE_URL = "https://dzaemdhyvcgstidhvykn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YWVtZGh5dmNnc3RpZGh2eWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzgyMDMsImV4cCI6MjA4NzE1NDIwM30.Rx6vmN3QPnF4vxKIQt6Okid6SYmwrGfyCpom1KtaEo8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ⭐ friendName 必須在全域
const friendName = localStorage.getItem("friendName");

window.addEventListener("DOMContentLoaded", () => {

  if (!friendName) window.location.href = "login.html";

  const welcomeText = document.getElementById("welcome-text");
  const welcomePopup = document.getElementById("welcome-popup");
  const welcomePopupText = document.getElementById("welcome-popup-text");

  const adminPasswordInput = document.getElementById("admin-password");
  const adminBtn = document.getElementById("admin-btn");
  const logoutBtn = document.getElementById("logout-btn");

  function showWelcomePopup(name) {
    welcomePopupText.textContent = `🎉 歡迎你，${name}！`;
    welcomePopup.style.display = "flex";
    setTimeout(() => (welcomePopup.style.display = "none"), 2500);
  }

  welcomeText.textContent = `你好，${friendName}！`;
  showWelcomePopup(friendName);

  // ⭐ 顯示後台按鈕（最重要）
  if (friendName.toLowerCase() === "fungfung") {
    adminPasswordInput.style.display = "block";
    adminBtn.style.display = "block";
  }

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("friendName");
    window.location.href = "login.html";
  });

  saveLoginHistory(friendName);
});

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
      name,
      count: 1,
      last_login: nowISO,
    });
  }
}

  // ============================
  // 未登入 → 回 login.html
  // ============================
  const friendName = localStorage.getItem("friendName");
  if (!friendName) window.location.href = "login.html";

  // ============================
  // DOM
  // ============================
  const welcomeText = document.getElementById("welcome-text");
  const welcomePopup = document.getElementById("welcome-popup");
  const welcomePopupText = document.getElementById("welcome-popup-text");

  const adminPasswordInput = document.getElementById("admin-password");
  const logoutBtn = document.getElementById("logout-btn");

  // ============================
  // 歡迎彈窗
  // ============================
  function showWelcomePopup(name) {
    welcomePopupText.textContent = `🎉 歡迎你，${name}！`;
    welcomePopup.style.display = "flex";
    setTimeout(() => (welcomePopup.style.display = "none"), 2500);
  }

  welcomeText.textContent = `你好，${friendName}！`;
  showWelcomePopup(friendName);

  // ============================
  // 限制分類
  // ============================
  const restrictedCats = ["man", "manman"];
  const currentUser = friendName.toLowerCase();

  restrictedCats.forEach(cat => {
    const option = document.querySelector(`option[value="${cat}"]`);
    if (currentUser !== "fungfung" && currentUser !== "manman") {
      if (option) option.remove();
    }
  });

  // ============================
  // 登出（最重要）
  // ============================
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("friendName");
    window.location.href = "login.html";
  });

});
// ============================
// 歡迎彈窗
// ============================
function showWelcomePopup(name) {
  welcomePopupText.textContent = `🎉 歡迎你，${name}！`;
  welcomePopup.style.display = "flex";
  setTimeout(() => (welcomePopup.style.display = "none"), 2500);
}

welcomeText.textContent = `你好，${friendName}！`;
showWelcomePopup(friendName);

// ============================
// 限制分類（man / manman）
// ============================
window.addEventListener("load", () => {
  const currentUser = friendName.toLowerCase();
  const restrictedCats = ["man", "manman"];

  restrictedCats.forEach(cat => {
    const option = document.querySelector(`option[value="${cat}"]`);
    if (currentUser !== "fungfung" && currentUser !== "manman") {
      if (option) option.remove();
    }
  });
});

// ============================
// 儲存登入紀錄
// ============================
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
      name,
      count: 1,
      last_login: nowISO,
    });
  }
}

saveLoginHistory(friendName);

// ============================
// 管理員顯示
// ============================
if (friendName === "fungfung") {
  adminPasswordInput.style.display = "block";
  adminBtn.style.display = "block";
}
/* ============================
   ⭐ 登出
============================ */
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("friendName");
  window.location.href = "login.html";
});
