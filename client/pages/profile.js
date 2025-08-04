import { getCurrentUser } from "../services/authState.js";
import { renderHeader } from "../components/header.js";
import { api } from "../services/api.js";
import { renderPosts } from "../features/postRenderer.js";
import { escapeHtml } from "../utils/escapeHtml.js";

export async function showProfile(params, navigate) {
  const app = document.getElementById("app");
  const loggedInUser = getCurrentUser();

  if (!params?.userId && !loggedInUser?.id) {
    navigate("login");
    return;
  }

  const userIdToLoad = params?.userId || loggedInUser.id;

  // Загружаем пользователя
  let currentUser;
  try {
    currentUser = await api.getUser(userIdToLoad);
  } catch {
    navigate("feed");
    return;
  }

  const isOwner = loggedInUser?.id === currentUser.id;

  // Проверка подписки
  let isSubscribed = false;
  if (loggedInUser && !isOwner) {
    try {
      const res = await api.isFollowing(currentUser.id);
      isSubscribed = res.isSubscribed;
    } catch {}
  }

  // Рендер шапки
  app.innerHTML = "";
  renderHeader({
    auth: !!loggedInUser,
    onSearch: (query) => navigate(query ? "search" : "feed", { query }),
  });

  const main = document.createElement("main");
  main.className = "main";
  main.innerHTML = `
    <div class="container profile-page">
      <section class="profile-info">
        <div class="profile-info__photo">
          <img src="${escapeHtml(
            currentUser.avatar
          )}" alt="Аватар" class="profile-avatar"/>
          ${
            isOwner
              ? `<button class="btn btn--small" id="changePhotoBtn">Изменить фото</button>`
              : ""
          }
        </div>
        <div class="profile-info__text">
          <h2 class="editable-name">
            ${escapeHtml(currentUser.name || "")}
            ${
              isOwner
                ? `<img src="../assets/images/edit.svg" alt="Редактировать" id="editNameBtn" class="edit-icon--name" />`
                : ""
            }
          </h2>
          <p class="editable-bio">
            ${escapeHtml(currentUser.bio || "Расскажите о себе...")}
            ${
              isOwner
                ? `<img src="../assets/images/edit.svg" alt="Редактировать" id="editAboutBtn" class="edit-icon--bio"/>`
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
              : `<button class="profile-info__subscribe-btn" id="subscribeBtn">
                ${isSubscribed ? "Отписаться" : "Подписаться"}
               </button>
               <span class="profile-followers-count">Подписчики: ${
                 currentUser.followers?.length || 0
               }</span>`
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
        <hr />`
          : ""
      }
      <section class="profile-posts" id="profilePosts"></section>
    </div>
  `;
  app.appendChild(main);

  // Подписка
  document
    .getElementById("subscribeBtn")
    ?.addEventListener("click", async () => {
      if (!loggedInUser) return navigate("login");
      try {
        const result = isSubscribed
          ? await api.unfollowUser(currentUser.id)
          : await api.followUser(currentUser.id);
        isSubscribed = result.isSubscribed;
        document.getElementById("subscribeBtn").textContent = isSubscribed
          ? "Отписаться"
          : "Подписаться";
        document.querySelector(
          ".profile-followers-count"
        ).textContent = `Подписчики: ${result.followersCount}`;
      } catch {
        alert("Не удалось обновить подписку");
      }
    });

  // Смена фото (заглушка)
  document.getElementById("changePhotoBtn")?.addEventListener("click", () => {
    alert("Загрузка нового фото пока не реализована");
  });

  // Редактирование имени и биографии
  if (isOwner) {
    document
      .getElementById("editNameBtn")
      ?.addEventListener("click", () =>
        makeEditable(
          document.querySelector(".editable-name"),
          "name",
          currentUser.name || ""
        )
      );

    document
      .getElementById("editAboutBtn")
      ?.addEventListener("click", () =>
        makeEditable(
          document.querySelector(".editable-bio"),
          "bio",
          currentUser.bio || ""
        )
      );
  }

  function makeEditable(containerEl, fieldName, initialValue) {
    if (document.querySelector(".editable-input")) {
      return;
    }

    const isBio = fieldName === "bio";
    const input = document.createElement(isBio ? "textarea" : "input");
    input.className = "editable-input";
    input.value = initialValue;

    containerEl.innerHTML = "";
    containerEl.appendChild(input);
    input.focus();

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
      if (!newValue) return alert("Значение не может быть пустым");

      try {
        const updatedUser = await api.updateUser(currentUser.id, {
          [fieldName]: newValue,
        });
        currentUser = { ...currentUser, ...updatedUser };
        renderEditableField(
          containerEl,
          fieldName,
          updatedUser[fieldName] || ""
        );
        saveBtn.remove();
        cancelBtn.remove();

        if (fieldName === "name") {
          await loadUserPosts();
        }
      } catch {
        alert("Не удалось сохранить изменения");
      }
    });

    cancelBtn.addEventListener("click", () => {
      renderEditableField(containerEl, fieldName, initialValue);
      saveBtn.remove();
      cancelBtn.remove();
    });
  }

  function renderEditableField(containerEl, fieldName, value) {
    containerEl.innerHTML = `
    ${escapeHtml(value)} 
    <img src="../assets/images/edit.svg" alt="Редактировать" class="edit-icon--${fieldName}" />
  `;

    const editIcon = containerEl.querySelector("img");
    editIcon.addEventListener("click", () => {
      makeEditable(containerEl, fieldName, value);
    });
  }

  // Новый пост
  document
    .getElementById("newPostForm")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const content = document.getElementById("newPostContent").value.trim();
      if (!content) return alert("Пост не может быть пустым");
      try {
        await api.createPost({ content });
        document.getElementById("newPostContent").value = "";
        await loadUserPosts();
      } catch {
        alert("Ошибка при создании поста");
      }
    });

  // Загрузка постов профиля
  async function loadUserPosts() {
    const container = document.getElementById("profilePosts");
    try {
      const posts = await api.getUserPosts(userIdToLoad);

      const authorMap = { [currentUser.id]: currentUser };

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
