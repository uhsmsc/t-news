import { api } from "../services/api.js";
import { getCurrentUser } from "../services/authState.js";
import { renderHeader } from "../components/header.js";
import { renderPosts } from "../features/postRenderer.js";

export async function showFeed(_, navigate) {
  const app = document.getElementById("app");
  const currentUser = getCurrentUser();

  app.innerHTML = "";

  renderHeader({
    auth: !!currentUser,
    onSearch: (query) => {
      navigate(query ? "search" : "feed", { query });
    },
  });

  const main = document.createElement("main");
  main.className = "main";
  main.innerHTML = `<div class="container"><section class="feed" id="feed"></section></div>`;
  app.appendChild(main);

  const feedContainer = document.getElementById("feed");
  feedContainer.innerHTML = `<div class="feed__loading">Загрузка...</div>`;

  // Загружаем посты и авторов
  const posts = await api.getFeed();
  const authorMap = {};
  for (const post of posts) {
    if (!authorMap[post.authorId]) {
      authorMap[post.authorId] = await api.getUser(post.authorId);
    }
  }

  // Рендерим посты
  await renderPosts({
    container: feedContainer,
    posts,
    authorsMap: authorMap,
    currentUser,
    navigate,
  });
}
