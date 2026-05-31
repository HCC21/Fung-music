let currentIndex = 0;
const friendName = localStorage.getItem("friendName");

// ============================
// 播放清單
// ============================
function generatePlaylist(filterCat = "all", keyword = "") {
  const playlistContainer = document.getElementById("playlist-buttons");
  playlistContainer.innerHTML = "";

  const currentUser = friendName.toLowerCase();
  let displayIndex = -1;

  songsData.forEach(song => {
    if (song.cat === "man" && currentUser !== "fungfung" && currentUser !== "manman") return;

    if (Array.isArray(song.allowedUsers)) {
      const allowed = song.allowedUsers.map(u => u.toLowerCase());
      if (!allowed.includes(currentUser)) return;
    }

    if (keyword && !song.name.toLowerCase().includes(keyword)) return;

    if (filterCat !== "all" && song.cat !== filterCat) return;

    displayIndex++;
    const thisIndex = displayIndex;

    const btn = document.createElement("button");
    btn.classList.add("playlist-item");

    btn.setAttribute("data-src", song.src);
    btn.setAttribute("data-name", song.name);
    btn.setAttribute("data-cover", song.cover);

    btn.innerHTML = `
      <img src="${song.cover}" class="playlist-cover">
      <span>${song.name}</span>
      <div class="play-count">0</div>
    `;

    getPlayCount(song.src).then(count => {
      btn.querySelector(".play-count").textContent = `${count}`;
    });

    const img = new Image();
    img.src = song.cover;
    img.onload = () => {
      const color = getDominantColor(img);
      btn.style.background = `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`;
      btn.style.borderColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.45)`;
    };

    btn.addEventListener("click", async () => {
      currentIndex = thisIndex;
      playFromPlaylist(thisIndex);

      const newCount = await getPlayCount(song.src);
      btn.querySelector(".play-count").textContent = `${newCount}`;
    });

    playlistContainer.appendChild(btn);
  });
}

// ============================
// 播放次數
// ============================
async function increasePlayCount(src) {
  const { data } = await supabaseClient
    .from("song_stats")
    .select("count")
    .eq("src", src)
    .maybeSingle();

  if (!data) {
    await supabaseClient.from("song_stats").insert([{ src, count: 1 }]);
  } else {
    await supabaseClient
      .from("song_stats")
      .update({ count: data.count + 1 })
      .eq("src", src);
  }
}

async function getPlayCount(src) {
  const { data } = await supabaseClient
    .from("song_stats")
    .select("count")
    .eq("src", src)
    .maybeSingle();

  return data ? data.count : 0;
}
