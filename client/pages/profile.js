import { getCurrentUser } from "./authState.js";
import { navigate } from "./app.js";
import { renderHeader } from "../components/header.js";
import { api } from "./api.js";
import { createPostCard } from "../components/post.js";
import {
  commentsState,
  loadComments,
  showCommentsChunk,
} from "../components/comments.js";

export async function showProfile(_, navigate) {
  const app = document.getElementById("app");
  const storedUser = getCurrentUser();

  if (!storedUser) {
    navigate("login");
    return;
  }

  // Загружаем полные данные пользователя
  let currentUser = await api.getUser(storedUser.id);

  app.innerHTML = "";
  renderHeader({
    auth: true,
    onSearch: (query) => {
      if (!query) {
        navigate("feed");
      } else {
        navigate("search", { query });
      }
    },
  });

  const main = document.createElement("main");
  main.className = "main";
  main.innerHTML = `<div class="container profile-page">
                      <section class="profile-info">
                        <div class="profile-info__photo">
                          <img src="${currentUser.avatar}" alt="Аватар" class="profile-avatar"/>
                          <button class="btn btn--small" id="changePhotoBtn">Изменить фото</button>
                        </div>
                        <div class="profile-info__text">
                          <h2 class="editable-name">
                            ${escapeHtml(currentUser.name)}
                            <img src="../assets/images/edit.svg" alt="Редактировать" class="edit-icon--name" id="editNameBtn" />
                          </h2>
                          <p class="editable-bio">
                            ${escapeHtml(currentUser.bio || "Расскажите о себе...")}
                            <img src="../assets/images/edit.svg" alt="Редактировать" class="edit-icon--about" id="editAboutBtn" />
                          </p>
                        </div>
                        <div class="profile-info__actions">
                          <button class="profile-info__subscribe-btn" id="subscribeBtn">Подписаться</button>
                        </div>
                      </section>
                      <hr />
                      <section class="profile-new-post">
                        <form id="newPostForm" class="comment-form">
                          <textarea id="newPostContent" placeholder="Введите свой пост" required></textarea>
                          <button type="submit">Отправить</button>
                        </form>
                      </section>
                      <hr />
                      <section class="profile-posts" id="profilePosts"></section>
                    </div>`;

  app.appendChild(main);

  document.getElementById("subscribeBtn").addEventListener("click", () => {
    alert("Подписка пока не реализована");
  });
  document.getElementById("changePhotoBtn").addEventListener("click", () => {
    alert("Загрузка нового фото пока не реализована");
  });

  function makeEditable(containerEl, fieldName, initialValue) {
    const isBio = fieldName === "bio";

    const existingSave = document.querySelector(".editable-save");
    const existingCancel = document.querySelector(".editable-cancel");
    if (existingSave || existingCancel) {
      return;
    }

    const input = document.createElement(isBio ? "textarea" : "input");
    input.value = initialValue || "";
    input.classList.add("editable-input");
    input.style.font = getComputedStyle(containerEl).font;

    // Заменяем содержимое поля на input
    containerEl.innerHTML = "";
    containerEl.appendChild(input);

    const actionsEl = document.querySelector(".profile-info__actions");

    // Кнопки
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Сохранить";
    saveBtn.classList.add("editable-save");

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Отмена";
    cancelBtn.classList.add("editable-cancel");

    actionsEl.appendChild(saveBtn);
    actionsEl.appendChild(cancelBtn);

    // Сохранение
    saveBtn.addEventListener("click", async () => {
      const newValue = input.value.trim();
      if (!newValue) {
        alert("Значение не может быть пустым");
        return;
      }
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

        if (fieldName === "name") {
          await loadUserPosts(currentUser.id);
        }
      } catch (err) {
        console.error(`Ошибка при изменении ${fieldName}:`, err);
        alert("Не удалось сохранить изменения");
      } finally {
        removeEditButtons();
      }
    });

    // Отмена
    cancelBtn.addEventListener("click", () => {
      renderEditableField(containerEl, fieldName, initialValue || "");
      removeEditButtons();
    });

    function removeEditButtons() {
      saveBtn.remove();
      cancelBtn.remove();
    }
  }

  function renderEditableField(containerEl, fieldName, value) {
    containerEl.innerHTML = `
    ${escapeHtml(value)} 
    <img src="../assets/images/edit.svg" 
         alt="Редактировать" 
         class="edit-icon edit-icon--${fieldName}" 
         id="edit${capitalize(fieldName)}Btn" />
  `;
    document
      .getElementById(`edit${capitalize(fieldName)}Btn`)
      .addEventListener("click", () => {
        makeEditable(containerEl, fieldName, value);
      });
  }

  function attachEditHandlers() {
    const editNameBtn = document.getElementById("editNameBtn");
    if (editNameBtn) {
      editNameBtn.onclick = () => {
        const nameEl = document.querySelector(".editable-name");
        makeEditable(nameEl, "name", currentUser.name);
      };
    }

    const editAboutBtn = document.getElementById("editAboutBtn");
    if (editAboutBtn) {
      editAboutBtn.onclick = () => {
        const bioEl = document.querySelector(".editable-bio");
        makeEditable(bioEl, "bio", currentUser.bio || "Расскажите о себе...");
      };
    }
  }

  // Обработчики нажатия на иконки редактирования
  function attachEditHandlers() {
    const editNameBtn = document.getElementById("editNameBtn");
    if (editNameBtn) {
      editNameBtn.onclick = () => {
        const nameEl = document.querySelector(".editable-name");
        makeEditable(nameEl, "name", currentUser.name);
      };
    }

    const editAboutBtn = document.getElementById("editAboutBtn");
    if (editAboutBtn) {
      editAboutBtn.onclick = () => {
        const bioEl = document.querySelector(".editable-bio");
        makeEditable(bioEl, "bio", currentUser.bio || "Расскажите о себе...");
      };
    }
  }

  attachEditHandlers();

  // Новый пост
  const newPostForm = document.getElementById("newPostForm");
  newPostForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = document.getElementById("newPostContent").value.trim();
    if (!content) return;

    await api.createPost({ authorId: currentUser.id, content });
    document.getElementById("newPostContent").value = "";
    await loadUserPosts(currentUser.id);
  });

  // Загружаем посты пользователя
  await loadUserPosts(currentUser.id);
}

async function loadUserPosts(userId) {
  const container = document.getElementById("profilePosts");
  container.innerHTML = "";

  const posts = await api.getUserPosts(userId);
  const authorMap = { [userId]: await api.getUser(userId) };

  posts.sort((a, b) => b.id - a.id);

  posts.forEach((post) => {
    const postHTML = createPostCard(post, authorMap[userId], userId);
    const temp = document.createElement("div");
    temp.innerHTML = postHTML;
    const postElement = temp.firstElementChild;

    // кнопка удаления
    const deleteBtn = document.createElement("img");
    deleteBtn.src = "/assets/images/container.svg";
    deleteBtn.alt = "Удалить пост";
    deleteBtn.classList.add("post__delete-btn");

    const postHeader = postElement.querySelector(".post__header");
    if (postHeader) {
      postHeader.appendChild(deleteBtn);
    } else {
      postElement.insertBefore(deleteBtn, postElement.firstChild);
    }

    deleteBtn.addEventListener("click", async () => {
      if (confirm("Удалить этот пост?")) {
        try {
          await api.deletePost(post.id, userId);
          await loadUserPosts(userId);
        } catch (err) {
          console.error("Ошибка при удалении поста:", err);
          alert("Не удалось удалить пост");
        }
      }
    });

    // контейнер для комментариев
    const commentsContainer = document.createElement("div");
    commentsContainer.classList.add("comments-container");
    commentsContainer.dataset.postId = post.id;

    const commentBtn = postElement.querySelector(".post__comment-button");
    commentBtn.addEventListener("click", async () => {
      const isVisible = commentsContainer.classList.contains(
        "comments-container--visible"
      );
      if (!isVisible) {
        commentsContainer.innerHTML = "";
        commentsContainer.classList.add("comments-container--visible");
        if (!commentsState[post.id]) {
          commentsState[post.id] = {};
          await loadComments(post.id, commentsState[post.id]);
        }
        await showCommentsChunk(post.id, commentsContainer, userId, navigate);
      } else {
        commentsContainer.innerHTML = "";
        commentsContainer.classList.remove("comments-container--visible");
        commentsState[post.id].shownCount = 0;
      }
    });

    const wrapper = document.createElement("div");
    wrapper.classList.add("post-wrapper");
    wrapper.appendChild(postElement);
    wrapper.appendChild(commentsContainer);

    container.appendChild(wrapper);
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
