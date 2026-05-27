/* ============================
   🎵 Supabase 初始化
============================ */
const SUPABASE_URL = "https://dzaemdhyvcgstidhvykn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YWVtZGh5dmNnc3RpZGh2eWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzgyMDMsImV4cCI6MjA4NzE1NDIwM30.Rx6vmN3QPnF4vxKIQt6Okid6SYmwrGfyCpom1KtaEo8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

/* ============================
   🎵 DOM 元素
============================ */
const loginBtn = document.getElementById("login-btn");
const usernameInput = document.getElementById("username-input");
const passwordInput = document.getElementById("password-input");

/* ============================
   🎉 登入功能
============================ */
loginBtn.addEventListener("click", async () => {
  const name = usernameInput.value.trim();
  const pass = passwordInput.value.trim();

  if (!name || !pass) {
    alert("請輸入名字和密碼");
    return;
  }

  // 查 Supabase 用戶
  const { data, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("name", name)
    .eq("password", pass)
    .single();

  if (error || !data) {
    alert("登入失敗，請檢查名字或密碼");
    return;
  }

  // 儲存登入者
  localStorage.setItem("friendName", name);

  // 跳轉主頁
  window.location.href = "index.html";
});

/* ============================
   ⌨️ Enter 鍵也可以登入
============================ */
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});
