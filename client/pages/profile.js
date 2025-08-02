import { getCurrentUser } from "../services/authState.js";
import { renderHeader } from "../components/header.js";
import { api } from "../services/api.js";
import { renderPosts } from "../features/postRenderer.js";
import { escapeHtml } from "../utils/escapeHtml.js";

export async function showProfile(params, navigate) {
  const app = document.getElementById("app");
  const loggedInUser = getCurrentUser();

  const profileUserId = params?.userId || loggedInUser?.id;
  if (!profileUserId) {
    navigate("login");
    return;
  }

  // Загружаем данные профиля
  let currentUser = await api.getUser(profileUserId);
  const isOwner = loggedInUser && loggedInUser.id === currentUser.id;

  // Проверка подписки
  let isSubscribed = false;
  if (loggedInUser && !isOwner) {
    try {
      const res = await api.isFollowing(currentUser.id, loggedInUser.id);
      isSubscribed = res.isSubscribed;
    } catch {
      isSubscribed = false;
    }
  }

  // Рендер шапки
  app.innerHTML = "";
  renderHeader({
    auth: !!loggedInUser,
    onSearch: (query) => {
      if (!query) navigate("feed");
      else navigate("search", { query });
    },
  });

  // Основная разметка профиля
  const main = document.createElement("main");
  main.className = "main";
  main.innerHTML = `
    <div class="container profile-page">
      <section class="profile-info">
        <div class="profile-info__photo">
          <img src="${currentUser.avatar}" alt="Аватар" class="profile-avatar"/>
          ${
            isOwner
              ? `<button class="btn btn--small" id="changePhotoBtn">Изменить фото</button>`
              : ""
          }
        </div>
        <div class="profile-info__text">
          <h2 class="editable-name">
            ${escapeHtml(currentUser.name)}
            ${
              isOwner
                ? `<img src="../assets/images/edit.svg" alt="Редактировать" class="edit-icon--name" id="editNameBtn" />`
                : ""
            }
          </h2>
          <p class="editable-bio">
            ${escapeHtml(currentUser.bio || "Расскажите о себе...")}
            ${
              isOwner
                ? `<img src="../assets/images/edit.svg" alt="Редактировать" class="edit-icon--about" id="editAboutBtn" />`
                : ""
            }
          </p>
        </div>
        <div class="profile-info__actions">
          ${
            isOwner
              ? `<div class="profile-followers">Подписчики: ${
                  currentUser.followers?.length || 0
                }</div>`
              : loggedInUser
              ? `<button class="profile-info__subscribe-btn" id="subscribeBtn">${
                  isSubscribed ? "Отписаться" : "Подписаться"
                }</button>
                 <span class="profile-followers-count">Подписчики: ${
                   currentUser.followers?.length || 0
                 }</span>`
              : `<button class="profile-info__subscribe-btn" id="subscribeBtn">Подписаться</button>`
          }
        </div>
      </section>
      <hr />
      ${
        isOwner
          ? `
        <section class="profile-new-post">
          <form id="newPostForm" class="comment-form">
            <textarea id="newPostContent" placeholder="Введите свой пост" required></textarea>
            <button type="submit">Отправить</button>
          </form>
        </section>
        <hr />
      `
          : ""
      }
      <section class="profile-posts" id="profilePosts"></section>
    </div>
  `;
  app.appendChild(main);

  // Подписка
  const subscribeBtn = document.getElementById("subscribeBtn");
  if (subscribeBtn) {
    subscribeBtn.addEventListener("click", async () => {
      if (!loggedInUser) {
        navigate("login");
        return;
      }
      const result = await api.follow(currentUser.id, loggedInUser.id);
      subscribeBtn.textContent = result.isSubscribed
        ? "Отписаться"
        : "Подписаться";
      const followersCountEl = document.querySelector(
        ".profile-followers-count"
      );
      if (followersCountEl) {
        followersCountEl.textContent = `Подписчики: ${result.followersCount}`;
      }
    });
  }

  // Смена фото
  if (isOwner) {
    document.getElementById("changePhotoBtn")?.addEventListener("click", () => {
      alert("Загрузка нового фото пока не реализована");
    });
  }

  // Редактирование имени/био
  if (isOwner) {
    document.getElementById("editNameBtn")?.addEventListener("click", () => {
      makeEditable(
        document.querySelector(".editable-name"),
        "name",
        currentUser.name
      );
    });
    document.getElementById("editAboutBtn")?.addEventListener("click", () => {
      makeEditable(
        document.querySelector(".editable-bio"),
        "bio",
        currentUser.bio || "Расскажите о себе..."
      );
    });
  }

  function makeEditable(containerEl, fieldName, initialValue) {
    if (document.querySelector(".editable-input")) {
      return;
    }

    const isBio = fieldName === "bio";
    const input = document.createElement(isBio ? "textarea" : "input");
    input.className = "editable-input";
    input.value = initialValue || "";

    containerEl.innerHTML = "";
    containerEl.appendChild(input);

    const actionsEl = document.querySelector(".profile-info__actions");

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Сохранить";
    saveBtn.className = "editable-save";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.className = "editable-cancel";

    actionsEl.append(saveBtn, cancelBtn);

    saveBtn.addEventListener("click", async () => {
      const newValue = input.value.trim();
      if (!newValue) return;
      const updatedUser = await api.updateUser(currentUser.id, {
        [fieldName]: newValue,
      });
      currentUser = { ...currentUser, ...updatedUser };
      renderEditableField(containerEl, fieldName, updatedUser[fieldName] || "");
      saveBtn.remove();
      cancelBtn.remove();
      if (fieldName === "name") {
        await loadUserPosts();
      }
    });

    cancelBtn.addEventListener("click", () => {
      renderEditableField(containerEl, fieldName, initialValue || "");
      saveBtn.remove();
      cancelBtn.remove();
    });
  }

  function renderEditableField(containerEl, fieldName, value) {
    containerEl.innerHTML = `${escapeHtml(
      value
    )} <img src="../assets/images/edit.svg" class="edit-icon--${fieldName}" />`;
    containerEl.querySelector("img").addEventListener("click", () => {
      makeEditable(containerEl, fieldName, value);
    });
  }

  // Новый пост
  if (isOwner) {
    document
      .getElementById("newPostForm")
      ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = document.getElementById("newPostContent").value.trim();
        if (!content) return;
        await api.createPost({ authorId: currentUser.id, content });
        document.getElementById("newPostContent").value = "";
        await loadUserPosts();
      });
  }

  // Функция загрузки постов профиля
  async function loadUserPosts() {
    const container = document.getElementById("profilePosts");
    container.innerHTML = `<div class="feed__loading">Загрузка...</div>`;

    try {
      const posts = (await api.getUserPosts(currentUser.id))
        .filter((p) => p.authorId === currentUser.id)
        .sort((a, b) => b.id - a.id);

      const authorMap = {};

      // 1. Загружаем авторов постов
      for (const post of posts) {
        if (!authorMap[post.authorId]) {
          authorMap[post.authorId] = await api.getUser(post.authorId);
        }

        // 2. Загружаем авторов комментариев к посту
        const comments = await api.getComments(post.id);
        for (const comment of comments) {
          if (!authorMap[comment.authorId]) {
            authorMap[comment.authorId] = await api.getUser(comment.authorId);
          }
        }
      }

      await renderPosts({
        container,
        posts,
        authorsMap: authorMap,
        currentUser: loggedInUser,
        navigate,
        onRefresh: loadUserPosts,
        allowDelete: true,
      });
    } catch (err) {
      console.error("Ошибка загрузки постов профиля:", err);
      container.innerHTML = `<div class="feed__error">Не удалось загрузить посты</div>`;
    }
  }

  await loadUserPosts();
}
