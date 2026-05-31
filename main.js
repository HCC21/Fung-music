/* ============================
   ⭐ 網站啟動
============================ */
window.addEventListener("load", () => {
  autoScrollSidebar();
  generatePlaylist("all", "");
});
// ⭐ 分類切換
document.getElementById("categories-select").addEventListener("change", (e) => {
  const keyword = document.getElementById("search").value.trim();
  generatePlaylist(e.target.value, keyword);
});

// ⭐ 搜尋
document.getElementById("search").addEventListener("input", (e) => {
  const cat = document.getElementById("categories-select").value;
  generatePlaylist(cat, e.target.value.trim());
});
