import { api } from "../services/api.js";
import { createCommentCard } from "../components/comment.js";
import { createDeleteButton } from "../utils/deleteButton.js";

const COMMENTS_BATCH_SIZE = 5;

export async function renderComments(
  postId,
  container,
  currentUser,
  navigate
) {
  try {
    const comments = await api.getComments(postId);
    const authorsMap = {};

    for (const comment of comments) {
      if (!authorsMap[comment.authorId]) {
        authorsMap[comment.authorId] = await api.getUser(comment.authorId);
      }
    }

    container.innerHTML = "";

    let shownCount = 0;
    const commentsList = document.createElement("div");
    commentsList.className = "comments-list";
    container.appendChild(commentsList);

    let toggleBtn = null;
    const commentsFooter = document.createElement("div");
    commentsFooter.className = "comments-footer";

    if (comments.length > COMMENTS_BATCH_SIZE) {
      toggleBtn = document.createElement("button");
      toggleBtn.className = "comments-toggle-btn";
      commentsFooter.appendChild(toggleBtn);
    }

    const form = createCommentForm(postId, container, currentUser, navigate);
    commentsFooter.appendChild(form);
    container.appendChild(commentsFooter);

    function updateToggleBtn() {
      if (!toggleBtn) return;
      toggleBtn.textContent =
        shownCount >= comments.length ? "Скрыть комментарии" : "Показать ещё";
    }

    function renderBatch() {
      const batch = comments.slice(shownCount, shownCount + COMMENTS_BATCH_SIZE);
      for (const comment of batch) {
        const author = authorsMap[comment.authorId];
        const commentEl = createCommentElement(
          comment,
          author,
          currentUser,
          navigate,
          postId
        );
        commentsList.appendChild(commentEl);
      }
      shownCount += batch.length;
      updateToggleBtn();
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        if (shownCount >= comments.length) {
          const postWrapper = container.closest(".post-wrapper");
          const commentBtn = postWrapper?.querySelector(".post__comment-button");
          if (commentBtn) commentBtn.click();
        } else {
          renderBatch();
        }
      });
    }

    renderBatch();
  } catch (err) {
    console.error("Ошибка загрузки комментариев:", err);
    container.innerHTML = `<div class="feed__error">Не удалось загрузить комментарии</div>`;
  }
}

function createCommentElement(comment, author, currentUser, navigate, postId) {
  const temp = document.createElement("div");
  temp.innerHTML = createCommentCard(comment, author, currentUser?.id);
  const div = temp.firstElementChild;

  div.querySelector("[data-user-id]")?.addEventListener("click", (e) => {
    e.stopPropagation();
    navigate("profile", { userId: author.id });
  });

  if (currentUser && currentUser.id === author.id) {
    const deleteBtn = createDeleteButton(async () => {
      try {
        await api.deleteComment(comment.id, currentUser.id);
        div.remove();
        updateCommentsCountForPost(postId, -1);
      } catch (err) {
        alert("Ошибка при удалении комментария");
        console.error(err);
      }
    });
    div.querySelector(".comment__header").appendChild(deleteBtn);
  }

  return div;
}

async function appendComment(newComment, currentUser, navigate, container) {
  const author = await api.getUser(newComment.authorId);
  const commentEl = createCommentElement(
    newComment,
    author,
    currentUser,
    navigate,
    newComment.postId
  );

  const commentsList = container.querySelector(".comments-list");
  if (commentsList) {
    commentsList.appendChild(commentEl);
  }
}

function createCommentForm(postId, container, currentUser, navigate) {
  const form = document.createElement("form");
  form.className = "comment-form";
  form.innerHTML = `
    <textarea placeholder="Введите комментарий" required></textarea>
    <button type="submit">Отправить</button>
  `;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const textarea = form.querySelector("textarea");
    const content = textarea.value.trim();
    if (!content) return;

    if (!currentUser) {
      alert("Нужно войти");
      navigate("login");
      return;
    }

    try {
      const newComment = await api.addComment({
        postId,
        authorId: currentUser.id,
        content,
      });
      textarea.value = "";
      await appendComment(newComment, currentUser, navigate, container);
      updateCommentsCountForPost(postId, 1);
    } catch (err) {
      alert("Ошибка при добавлении комментария");
      console.error(err);
    }
  });

  return form;
}

export function updateCommentsCountForPost(postId, delta) {
  const postWrapper = document.querySelector(`.post-wrapper[data-post-id="${postId}"]`);
  if (!postWrapper) return;

  const commentBtn = postWrapper.querySelector(".post__comment-button");
  if (!commentBtn) return;

  const currentCount = Number(commentBtn.textContent.replace(/[^\d]/g, "")) || 0;
  const newCount = currentCount + delta;
  commentBtn.textContent = `Комментарии ${newCount}`;
}
