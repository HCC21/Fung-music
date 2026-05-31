// ============================
// Supabase 初始化
// ============================
const SUPABASE_URL = "https://dzaemdhyvcgstidhvykn.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6YWVtZGh5dmNnc3RpZGh2eWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NzgyMDMsImV4cCI6MjA4NzE1NDIwM30.Rx6vmN3QPnF4vxKIQt6Okid6SYmwrGfyCpom1KtaEo8";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("admin.js loaded");

// ============================
// DOM 元素
// ============================
const adminBtn = document.getElementById("admin-btn");
const adminPanel = document.getElementById("admin-panel");
const adminClose = document.getElementById("admin-close");
const adminPasswordInput = document.getElementById("admin-password");

const userList = document.getElementById("user-list");
const addUserBtn = document.getElementById("add-user-btn");
const loginHistoryList = document.getElementById("admin-login-history");

// ============================
// 開啟後台
// ============================
if (adminBtn) {
  adminBtn.addEventListener("click", () => {
    console.log("adminBtn clicked");

    const pwd = adminPasswordInput.value.trim();
    if (pwd !== "fungfung123") {
      alert("密碼錯誤！");
      return;
    }

    adminPanel.style.display = "block";
    loadAllUsers();
    loadLoginHistory();
  });
}

// ============================
// 關閉後台
// ============================
if (adminClose) {
  adminClose.addEventListener("click", () => {
    adminPanel.style.display = "none";
  });
}

// ============================
// 讀取所有用戶
// ============================
async function loadAllUsers() {
  const { data, error } = await supabaseClient.from("users").select("*");

  if (error) {
    console.error("Load users error:", error);
    return;
  }

  userList.innerHTML = "";

  data.forEach((user) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${user.name}</strong>
      ${user.name === "fungfung" ? "(管理員)" : ""}
      <div class="user-actions">
        <button class="reset-btn" data-id="${user.id}">重設密碼</button>
        <button class="delete-btn" data-id="${user.id}">刪除</button>
      </div>
    `;

    userList.appendChild(li);
  });

  bindUserButtons();
}

// ============================
// 綁定按鈕事件（重設密碼 / 刪除）
// ============================
function bindUserButtons() {
  document.querySelectorAll(".reset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      resetPassword(id);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      deleteUser(id);
    });
  });
}

// ============================
// 新增用戶
// ============================
addUserBtn.addEventListener("click", async () => {
  const name = prompt("輸入新用戶名稱：");
  const password = prompt("輸入密碼：");

  if (!name || !password) return;

  const { error } = await supabaseClient.from("users").insert({
    name,
    password,
  });

  if (error) {
    alert("新增失敗：" + error.message);
    return;
  }

  alert("新增成功！");
  loadAllUsers();
});

// ============================
// 重設密碼
// ============================
async function resetPassword(id) {
  console.log("resetPassword called, id =", id);

  const newPwd = prompt("輸入新密碼：");
  if (!newPwd) return;

  const { error } = await supabaseClient
    .from("users")
    .update({ password: newPwd })
    .eq("id", id);

  if (error) {
    alert("重設失敗：" + error.message);
    return;
  }

  alert("密碼已更新！");
}

// ============================
// 刪除用戶
// ============================
async function deleteUser(id) {
  console.log("deleteUser called, id =", id);

  if (!confirm("確定要刪除？")) return;

  const { error } = await supabaseClient
    .from("users")
    .delete()
    .eq("id", id);

  if (error) {
    alert("刪除失敗：" + error.message);
    return;
  }

  alert("刪除成功！");
  loadAllUsers();
}

// ============================
// 讀取登入紀錄
// ============================
async function loadLoginHistory() {
  const { data, error } = await supabaseClient
    .from("login_history")
    .select("*")
    .order("last_login", { ascending: false });

  if (error) {
    console.error("Load login history error:", error);
    return;
  }

  loginHistoryList.innerHTML = "";

  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.name} - ${item.last_login}（${item.count} 次登入）`;
    loginHistoryList.appendChild(li);
  });
}
