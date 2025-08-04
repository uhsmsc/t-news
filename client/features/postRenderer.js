import { createPostCard } from "../components/post.js";
import { api } from "../services/api.js";
import { setupLikeButton } from "./setupLikeButton.js";
import { renderComments } from "./commentsRender.js";
import { attachProfileLinks } from "../utils/profileLinks.js";
import { createDeleteButton } from "../utils/deleteButton.js";

export async function renderPosts({
  container,
  posts,
  authorsMap,
  currentUser,
  navigate,
  onRefresh,
  allowDelete = false,
}) {
  container.innerHTML = "";

  const sortedPosts = [...posts].reverse();

  for (const post of sortedPosts) {
    const author = authorsMap[post.userId];
    if (!author) continue;

    const postElement = createPostElement(
      post,
      author,
      currentUser,
      navigate,
      onRefresh,
      allowDelete
    );
    container.appendChild(postElement);
  }
}

function createPostElement(
  post,
  author,
  currentUser,
  navigate,
  onRefresh,
  allowDelete
) {
  const postHTML = createPostCard(post, author, currentUser?.id);
  const temp = document.createElement("div");
  temp.innerHTML = postHTML;
  const postEl = temp.firstElementChild;

  const wrapper = document.createElement("div");
  wrapper.classList.add("post-wrapper");
  wrapper.dataset.postId = post.id;

  const commentsContainer = document.createElement("div");
  commentsContainer.classList.add("comments-container");
  commentsContainer.dataset.postId = post.id;
  commentsContainer.style.display = "none";

  wrapper.appendChild(postEl);
  wrapper.appendChild(commentsContainer);

  attachProfileLinks(postEl, navigate);
  setupLikeButton(postEl, post.id, currentUser?.id, navigate, post.likes || []);

  setupCommentsToggle(
    postEl,
    post.id,
    currentUser,
    commentsContainer,
    navigate,
    onRefresh
  );

  if (allowDelete && currentUser?.id === post.userId) {
    const deleteBtn = createDeleteButton(async () => {
      try {
        await api.deletePost(post.id);
        if (onRefresh) await onRefresh();
      } catch (err) {
        alert("Не удалось удалить пост");
        console.error(err);
      }
    });
    const headerEl = postEl.querySelector(".post__header");
    if (headerEl) headerEl.appendChild(deleteBtn);
  }

  updateCommentsCount(postEl, post.commentCount);

  return wrapper;
}

function updateCommentsCount(postElement, count) {
  const commentBtn = postElement.querySelector(".post__comment-button");
  if (commentBtn) {
    commentBtn.textContent = `Комментарии ${count}`;
  }
}

function setupCommentsToggle(
  postElement,
  postId,
  currentUser,
  commentsContainer,
  navigate,
  onRefresh
) {
  const commentBtn = postElement.querySelector(".post__comment-button");
  if (!commentBtn) return;

  commentsContainer.dataset.loaded = "false";

  commentBtn.addEventListener("click", async () => {
    const isVisible = commentsContainer.style.display !== "none";

    if (!isVisible) {
      if (!currentUser) {
        const commentsCount =
          Number(commentBtn.textContent.replace(/\D/g, "")) || 0;
        if (commentsCount === 0) return;
      }

      commentsContainer.style.display = "block";

      if (commentsContainer.dataset.loaded === "false") {
        await renderComments(
          postId,
          commentsContainer,
          currentUser,
          navigate,
          onRefresh
        );
        commentsContainer.dataset.loaded = "true";
      }
    } else {
      commentsContainer.style.display = "none";
      commentsContainer.dataset.loaded = "false";
      commentsContainer.innerHTML = "";
    }
  });
}
