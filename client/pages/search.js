import { renderHeader } from "../components/header.js";
import { api } from "../services/api.js";
import { getCurrentUser } from "../services/authState.js";
import { renderPosts } from "../features/postRenderer.js";

export async function showSearchPage({ query = "", type = "users" }, navigate) {
  const app = document.getElementById("app");
  app.innerHTML = "";

  let currentType = type;
  let currentQuery = query;

  const searchInput = renderHeader({
    auth: true,
    onSearch: (q) => {
      currentQuery = q;
      updateResults();
    },
  });

  searchInput.value = currentQuery;
  searchInput.focus();

  searchInput.addEventListener("blur", () => {
    if (!searchInput.value.trim()) {
      navigate("feed");
    }
  });

  const container = document.createElement("div");
  container.className = "search-page container";

  const filter = document.createElement("div");
  filter.className = "search-filter";

  const usersBtn = document.createElement("button");
  usersBtn.textContent = "Пользователи";
  usersBtn.className = "search-filter__btn";

  const postsBtn = document.createElement("button");
  postsBtn.textContent = "Посты";
  postsBtn.className = "search-filter__btn";

  filter.append(usersBtn, postsBtn);
  container.append(filter);

  const results = document.createElement("div");
  results.className = "search-results";
  container.append(results);

  app.appendChild(container);

  function updateButtons() {
    usersBtn.classList.toggle(
      "search-filter__btn--active",
      currentType === "users"
    );
    postsBtn.classList.toggle(
      "search-filter__btn--active",
      currentType === "posts"
    );
  }

  updateButtons();

  usersBtn.addEventListener("click", () => {
    if (currentType !== "users") {
      currentType = "users";
      updateButtons();
      updateResults();
      searchInput.focus();
    }
  });

  postsBtn.addEventListener("click", () => {
    if (currentType !== "posts") {
      currentType = "posts";
      updateButtons();
      updateResults();
      searchInput.focus();
    }
  });

  function createUserCard(user) {
    return `
      <div class="user-card" data-user-id="${user.id}">
        <img 
          src="${user.avatar || "../assets/images/default-avatar.svg"}" 
          alt="${user.name}" 
          class="user-card__avatar"
        />
        <h3 class="user-card__name">${user.name}</h3>
      </div>
    `;
  }

  async function updateResults() {
    if (!currentQuery.trim()) {
      results.textContent = "Введите запрос для поиска";
      return;
    }

    results.textContent = "Загрузка…";

    try {
      if (currentType === "users") {
        const users = await api.search(currentQuery, "users");
        results.innerHTML = users.length
          ? users.map(createUserCard).join("")
          : "Пользователи не найдены";

        results.querySelectorAll("[data-user-id]").forEach((el) => {
          el.style.cursor = "pointer";
          el.addEventListener("click", () => {
            navigate("profile", { userId: el.dataset.userId });
          });
        });
      } else {
        let posts = await api.search(currentQuery, "posts");
        if (posts.length) {
          const authorMap = {};
          for (const post of posts) {
            if (!authorMap[post.authorId]) {
              authorMap[post.authorId] = await api.getUser(post.authorId);
            }
          }

          // Получаем количество комментариев по всем постам
          const postIds = posts.map(p => p.id);
          const commentCounts = await api.getCommentCounts(postIds);

          // Добавляем commentCount в каждый пост
          posts = posts.map(post => ({
            ...post,
            commentCount: commentCounts[post.id] || 0,
          }));

          const currentUser = getCurrentUser();

          await renderPosts({
            container: results,
            posts,
            authorsMap: authorMap,
            currentUser,
            navigate,
            onRefresh: updateResults,
          });
        } else {
          results.textContent = "Посты не найдены";
        }
      }
    } catch (error) {
      results.textContent = "Ошибка при поиске";
      console.error(error);
    }
  }

  updateResults();
}
