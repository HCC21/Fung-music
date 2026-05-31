/* ============================
   ⭐ 小遊戲選單
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

document.getElementById("game-close").addEventListener("click", () => {
  document.getElementById("game-modal").style.display = "none";

  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById("game-ui").innerHTML = "";

  resetGameEvents();
});

/* ============================
   ⭐ 清除遊戲事件 + 計時器
============================ */
function resetGameEvents() {
  document.onmousemove = null;
  document.onkeydown = null;

  const canvas = document.getElementById("game-canvas");
  canvas.onclick = null;
  canvas.ontouchmove = null;
  canvas.ontouchstart = null;

  clearInterval(sakuraPetalTimer);
  clearInterval(sakuraTimer);
  clearInterval(cartoonObstacleTimer);
}

/* ============================
   🌸 櫻花接花
============================ */
let sakuraPetalTimer = null;
let sakuraTimer = null;

function startSakuraGame() {
  const canvas = document.getElementById("game-canvas");
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
      speed: 1 + Math.random() * 2,
    });
  }

  document.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    basketX = e.clientX - rect.left - 40;
  };

  canvas.ontouchmove = (e) => {
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
    document.getElementById("game-ui").innerHTML =
      `分數：${score}｜剩餘時間：${timeLeft}s`;

    if (timeLeft <= 0) {
      gameRunning = false;
      clearInterval(sakuraTimer);
      clearInterval(sakuraPetalTimer);
      document.getElementById("game-ui").innerHTML =
        `🎉 遊戲結束！你的分數：${score}`;
    }
  }, 1000);

  update();
}

/* ============================
   🎨 卡通跳跳樂
============================ */
let cartoonObstacleTimer = null;

function startCartoonGame() {
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 400;
  canvas.height = 400;

  let player = {
    x: 50,
    y: 300,
    width: 30,
    height: 30,
    dy: 0,
    jumping: false,
  };

  let obstacles = [];
  let score = 0;
  let gameRunning = true;

  document.onkeydown = (e) => {
    if (e.code === "Space" && !player.jumping) {
      player.dy = -10;
      player.jumping = true;
    }
  };

  canvas.ontouchstart = (e) => {
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
      speed: 4,
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
        document.getElementById("game-ui").innerHTML =
          `💥 Game Over！分數：${score}`;
      }

      if (o.x + o.width < 0) {
        obstacles.splice(i, 1);
        score++;
      }
    });

    document.getElementById("game-ui").innerHTML = `分數：${score}`;

    requestAnimationFrame(update);
  }

  update();
}
