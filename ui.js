/* ============================
   ⭐ 主題切換
============================ */
document.getElementById("theme-select").addEventListener("change", (e) => {
  document.body.className = e.target.value;
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

  let r = 0, g = 0, b = 0, count = 0;

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
