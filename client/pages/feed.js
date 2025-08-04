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

  try {
    // Получаем посты
    const posts = await api.getFeed();

    const uniqueuserIds = [...new Set(posts.map((p) => p.userId))];
    const authorMapEntries = await Promise.all(
      uniqueuserIds.map((id) => api.getUser(id).then((user) => [id, user]))
    );
    const authorMap = Object.fromEntries(authorMapEntries);

    // Рендерим посты
    await renderPosts({
      container: feedContainer,
      posts,
      authorsMap: authorMap,
      currentUser,
      navigate,
    });
  } catch (error) {
    feedContainer.innerHTML = `<div class="feed__error">Ошибка загрузки ленты</div>`;
    console.error("Ошибка загрузки ленты:", error);
  }
}
