import { api } from "../services/api.js";
import { createCommentCard } from "../components/comment.js";
import { createDeleteButton } from "../utils/deleteButton.js";

const COMMENTS_BATCH_SIZE = 5;

export async function renderComments(postId, container, currentUser, navigate) {
  try {
    const comments = await api.getComments(postId);

    const userIds = [...new Set(comments.map((c) => c.userId))];
    const authorsList = await Promise.all(userIds.map((id) => api.getUser(id)));
    const authorsMap = Object.fromEntries(
      authorsList.map((author) => [author.id, author])
    );

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

    if (currentUser) {
      const form = createCommentForm(
        postId,
        container,
        currentUser,
        navigate,
        authorsMap
      );
      commentsFooter.appendChild(form);
    }

    if (commentsFooter.children.length > 0) {
      container.appendChild(commentsFooter);
    }

    function updateToggleBtn() {
      if (toggleBtn) {
        toggleBtn.textContent =
          shownCount >= comments.length ? "Скрыть комментарии" : "Показать ещё";
      }
    }

    function renderBatch() {
      const batch = comments.slice(
        shownCount,
        shownCount + COMMENTS_BATCH_SIZE
      );
      for (const comment of batch) {
        const author = authorsMap[comment.userId];
        commentsList.appendChild(
          createCommentElement(comment, author, currentUser, navigate, postId)
        );
      }
      shownCount += batch.length;
      updateToggleBtn();
    }

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        if (shownCount >= comments.length) {
          // Скрываем комментарии
          const postWrapper = container.closest(".post-wrapper");
          const commentBtn = postWrapper?.querySelector(
            ".post__comment-button"
          );
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
    const header = div.querySelector(".comment__header");
    if (header) {
      const deleteBtn = createDeleteButton(async () => {
        try {
          await api.deleteComment(comment.id, postId);
          div.remove();
          updateCommentsCountForPost(postId, -1);
        } catch (err) {
          alert("Ошибка при удалении комментария");
          console.error(err);
        }
      });
      header.appendChild(deleteBtn);
    }
  }

  return div;
}

async function appendComment(
  newComment,
  currentUser,
  navigate,
  container,
  authorsMap
) {
  let author = authorsMap?.[newComment.userId];
  if (!author) {
    author = await api.getUser(newComment.userId);
    if (authorsMap) authorsMap[newComment.userId] = author;
  }
  const commentEl = createCommentElement(
    newComment,
    author,
    currentUser,
    navigate,
    newComment.postId
  );
  container.querySelector(".comments-list")?.appendChild(commentEl);
}

function createCommentForm(
  postId,
  container,
  currentUser,
  navigate,
  authorsMap
) {
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

    try {
      const newComment = await api.addComment(postId, {
        userId: currentUser.id,
        content,
      });
      textarea.value = "";
      await appendComment(
        newComment,
        currentUser,
        navigate,
        container,
        authorsMap
      );
      updateCommentsCountForPost(postId, 1);
    } catch (err) {
      alert("Ошибка при добавлении комментария");
      console.error(err);
    }
  });

  return form;
}

export function updateCommentsCountForPost(postId, delta) {
  const commentBtn = document.querySelector(
    `.post-wrapper[data-post-id="${postId}"] .post__comment-button`
  );
  if (!commentBtn) return;
  const currentCount =
    Number(commentBtn.textContent.replace(/[^\d]/g, "")) || 0;
  commentBtn.textContent = `Комментарии ${currentCount + delta}`;
}
