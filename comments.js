/* ============================
   ⭐ 留言系統
============================ */
async function loadComments(songName, currentUser, songSrc) {
  const cleanSrc = songSrc ? songSrc.split("?")[0] : "";

 const { data: comments, error } = await supabaseClient
  .from("comments")
  .select("*")
  .eq("songName", songName)
  .order("id", { ascending: true });

  const list = document.getElementById("comment-list");
  list.innerHTML = "";

  if (error || !comments) return;

  comments.forEach((c) => {
    if (currentUser === "fungfung") {
      showComment(c, list);
      return;
    }

    if (!c.replyTo) {
      if (c.user === currentUser) showComment(c, list);
      return;
    }

    if (c.replyTo === currentUser || c.user === currentUser) {
      showComment(c, list);
    }
  });

  if (currentUser === "fungfung") {
    await supabaseClient
      .from("comments")
      .update({ isRead: true })
      .eq("songName", songName)
      .or(`songSrc.eq.${cleanSrc},songSrc.is.null`);
  }
}
function showComment(c, list) {
  const li = document.createElement("li");
  li.innerHTML = `
    <strong>${c.user}</strong>：${c.message}
    <br><small>${c.time}</small>
    <br><button class="reply-btn" data-user="${c.user}">回覆</button>
  `;
  list.appendChild(li);
}

document.getElementById("comment-submit").addEventListener("click", async () => {
  const input = document.getElementById("comment-input");
  const message = input.value.trim();
  if (!message) return;

  await supabaseClient.from("comments").insert({
    songName: title.textContent,
   songSrc: audio.src.split("?")[0],
    user: friendName,
    message,
    replyTo: input.dataset.replyTo || null,
    isRead: false,               // ⭐ 永遠 false
    time: new Date().toLocaleString(),
  });

  input.value = "";
  input.dataset.replyTo = "";

  loadComments(title.textContent, friendName, audio.src);
});
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("reply-btn")) {
    const replyUser = e.target.dataset.user;
    const input = document.getElementById("comment-input");
    input.value = `@${replyUser} `;
    input.dataset.replyTo = replyUser;
    input.focus();
  }
});

