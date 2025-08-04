import { renderHeader } from "../components/header.js";
import { api } from "../services/api.js";
import { getCurrentUser } from "../services/authState.js";
import { renderPosts } from "../features/postRenderer.js";
import { escapeHtml } from "../utils/escapeHtml.js";

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

  // Если ушли с инпута и поле пустое — возвращаемся на ленту
  searchInput.addEventListener("blur", () => {
    if (!searchInput.value.trim()) {
      navigate("feed");
    }
  });

  // Основной контейнер страницы
  const container = document.createElement("div");
  container.className = "search-page container";

  // Фильтр по типу поиска
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

  // Результаты поиска
  const results = document.createElement("div");
  results.className = "search-results";
  container.append(results);

  app.appendChild(container);

  // Обновление стилей кнопок фильтра
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

  // Функция создания карточки пользователя
  function createUserCard(user) {
    return `
      <div class="user-card" data-user-id="${
        user.id
      }" tabindex="0" role="button" aria-pressed="false">
        <img 
          src="${user.avatar || "../assets/images/default-avatar.svg"}" 
          alt="${user.name ? escapeHtml(user.name) : "Пользователь"}" 
          class="user-card__avatar"
        />
        <h3 class="user-card__name">${escapeHtml(user.name || "Без имени")}</h3>
      </div>
    `;
  }

  // Функция обновления результатов поиска
  async function updateResults() {
    if (!currentQuery.trim()) {
      results.textContent = "Введите запрос для поиска";
      return;
    }

    results.textContent = "Загрузка…";

    try {
      if (currentType === "users") {
        const users = await api.search(currentQuery, "users");
        if (users.length) {
          results.innerHTML = users.map(createUserCard).join("");

          // Навешиваем клики на карточки пользователей
          results.querySelectorAll("[data-user-id]").forEach((el) => {
            el.style.cursor = "pointer";
            el.addEventListener("click", () => {
              navigate("profile", { userId: el.dataset.userId });
            });
            el.addEventListener("keydown", (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate("profile", { userId: el.dataset.userId });
              }
            });
          });
        } else {
          results.textContent = "Пользователи не найдены";
        }
      } else {
        const posts = await api.search(currentQuery, "posts");
        if (posts.length) {
          const currentUser = getCurrentUser();
          const authorsMap = {};

          // Загружаем авторов
          await Promise.all(
            posts.map(async (post) => {
              if (!authorsMap[post.userId]) {
                authorsMap[post.userId] = await api.getUser(post.userId);
              }
            })
          );

          await renderPosts({
            container: results,
            posts,
            authorsMap,
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
