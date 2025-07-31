import { api } from "../pages/api.js";
import { showComment } from "./comment.js";
import { getCurrentUser } from "../pages/authState.js";

export const COMMENTS_CHUNK_SIZE = 5;
export const commentsState = {};

// Загружаем все комментарии поста
export async function loadComments(postId, state) {
  const comments = await api.getComments(postId);
  state.allComments = comments;
  state.shownCount = 0;
  state.authorMap = {};

  for (const comment of comments) {
    if (!state.authorMap[comment.authorId]) {
      state.authorMap[comment.authorId] = await api.getUser(comment.authorId);
    }
  }
}

// Отображаем порцию комментариев (5 шт)
export async function showCommentsChunk(
  postId,
  container,
  postAuthorId,
  navigate
) {
  if (!commentsState[postId]) {
    commentsState[postId] = {};
    await loadComments(postId, commentsState[postId]);
  }

  const state = commentsState[postId];
  const { allComments, shownCount, authorMap } = state;
  const chunk = allComments.slice(shownCount, shownCount + COMMENTS_CHUNK_SIZE);

  container.querySelector(".comment-more-button")?.remove();
  container.querySelector(".comment-form")?.remove();

  const currentUser = getCurrentUser();

  for (const comment of chunk) {
    const author = authorMap[comment.authorId];
    const commentHTML = showComment(comment, author, currentUser, postAuthorId);
    container.insertAdjacentHTML("beforeend", commentHTML);
  }

  state.shownCount += chunk.length;

  if (state.shownCount < allComments.length) {
    const moreBtn = document.createElement("button");
    moreBtn.className = "comment-more-button";
    moreBtn.textContent = "Показать ещё";
    moreBtn.addEventListener("click", async () => {
      await showCommentsChunk(postId, container, postAuthorId, navigate);
    });
    container.appendChild(moreBtn);
  }

  if (currentUser && currentUser.id === postAuthorId) {
    container.querySelectorAll(".comment__delete-button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const commentEl = btn.closest(".comment");
        const commentId = commentEl.dataset.commentId;

        await api.deleteComment(commentId, currentUser.id);

        await loadComments(postId, state);
        container.innerHTML = "";
        await showCommentsChunk(postId, container, postAuthorId, navigate);

        // Обновляем текст кнопки комментариев
        const postWrapper = container.closest(".post-wrapper");
        const commentButton = postWrapper?.querySelector(
          ".post__comment-button"
        );
        if (commentButton) {
          commentButton.textContent = `Комментарии ${state.allComments.length}`;
        }
      });
    });
  }

  if (currentUser) {
    const form = setupCommentForm(postId, container, postAuthorId, navigate);
    container.appendChild(form);
  }
}

// Форма отправки комментария
export function setupCommentForm(postId, container, postAuthorId, navigate) {
  const form = document.createElement("form");
  form.classList.add("comment-form");
  form.innerHTML = `
    <textarea id="comment-content" placeholder="Введите свой комментарий" required></textarea>
    <button type="submit">Отправить</button>
  `;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = form.querySelector("#comment-content").value.trim();
    const user = getCurrentUser();

    if (!user) {
      alert("Нужно войти");
      navigate("login");
      return;
    }

    if (!content) return;

    await api.addComment({ postId, authorId: user.id, content });

    const state = commentsState[postId];
    if (state) {
      await loadComments(postId, state);
      container.innerHTML = "";
      await showCommentsChunk(postId, container, postAuthorId, navigate);

      const postWrapper = container.closest(".post-wrapper");
      const commentButton = postWrapper?.querySelector(".post__comment-button");
      if (commentButton) {
        commentButton.textContent = `Комментарии ${state.allComments.length}`;
      }
    }

    form.reset();
  });

  return form;
}
