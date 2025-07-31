import { renderHeader } from "../components/header.js";
import { api } from "./api.js";
import { createPostCard } from "../components/post.js";
import { getCurrentUser } from "./authState.js";
import { setupCommentsToggle, setupLikeButton } from "./feed.js";

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

  // Функция для создания карточки пользователя с фото и именем
  function createUserCard(user) {
    return `
      <div class="user-card">
        <img 
          src="${user.avatar || "../assets/images/default-avatar.svg"}" 
          alt="${user.name}" 
          class="user-card__avatar"
        />
        <h3 class="user-card__name">${user.name}</h3>
      </div>
    `;
  }

  // Получаем авторов для постов
  async function getAuthors(posts) {
    const authorMap = {};
    for (const post of posts) {
      if (!authorMap[post.authorId]) {
        authorMap[post.authorId] = await api.getUser(post.authorId);
      }
    }
    return authorMap;
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
      } else {
        const posts = await api.search(currentQuery, "posts");
        if (posts.length) {
          const authorMap = await getAuthors(posts);
          const currentUser = getCurrentUser();
          const currentUserId = currentUser?.id || null;

          results.innerHTML = posts
            .map((post) => {
              const author = authorMap[post.authorId];
              return createPostCard(post, author, currentUserId);
            })
            .join("");

          // Для каждого поста создаём контейнер комментариев и подключаем лайки и комментарии
          posts.forEach((post) => {
            const postElement = results.querySelector(
              `.post[data-id="${post.id}"]`
            );
            if (!postElement) return;

            // Создаём контейнер для комментариев и вставляем после поста
            let commentsContainer = results.querySelector(
              `.comments-container[data-post-id="${post.id}"]`
            );
            if (!commentsContainer) {
              commentsContainer = document.createElement("div");
              commentsContainer.classList.add("comments-container");
              commentsContainer.dataset.postId = post.id;
              postElement.insertAdjacentElement("afterend", commentsContainer);
            }

            setupLikeButton(postElement, post.id, currentUserId, navigate);
            setupCommentsToggle(
              postElement,
              post.id,
              post.authorId,
              commentsContainer,
              navigate
            );
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
