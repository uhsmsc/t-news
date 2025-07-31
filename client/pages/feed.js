import { api } from "./api.js";
import { createPostCard } from "../components/post.js";
import {
  commentsState,
  loadComments,
  showCommentsChunk,
} from "../components/comments.js";
import { getCurrentUser } from "./authState.js";
import { renderHeader } from "../components/header.js";

export async function showFeed(_, navigate) {
  const app = document.getElementById("app");
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.id;

  app.innerHTML = "";

  const searchInput = renderHeader({
    auth: true,
    onSearch: (query) => {
      if (!query) {
        navigate("feed");
      } else {
        navigate("search", { query });
      }
    },
  });

  // Основной контейнер с лентой
  const main = document.createElement("main");
  main.className = "main";
  main.innerHTML = `<div class="container"><section class="feed" id="feed"></section></div>`;
  app.appendChild(main);

  const feedContainer = document.getElementById("feed");
  feedContainer.innerHTML = `<div class="feed__loading">Загрузка...</div>`;

  // Загружаем посты и авторов
  const posts = await api.getFeed();
  const authorMap = {};
  for (const post of posts) {
    if (!authorMap[post.authorId]) {
      authorMap[post.authorId] = await api.getUser(post.authorId);
    }
  }

  // Функция отрисовки постов
  function renderFeedPosts(postList, authors) {
    feedContainer.innerHTML = "";
    postList.forEach((post) => {
      const author = authors[post.authorId];
      const postHTML = createPostCard(post, author, currentUserId);
      const temp = document.createElement("div");
      temp.innerHTML = postHTML;
      const postElement = temp.firstElementChild;

      const wrapper = document.createElement("div");
      wrapper.classList.add("post-wrapper");

      const commentsContainer = document.createElement("div");
      commentsContainer.classList.add("comments-container");
      commentsContainer.dataset.postId = post.id;

      wrapper.appendChild(postElement);
      wrapper.appendChild(commentsContainer);
      feedContainer.appendChild(wrapper);

      setupCommentsToggle(
        postElement,
        post.id,
        post.authorId,
        commentsContainer,
        navigate
      );
      setupLikeButton(postElement, post.id, currentUserId, navigate);
    });
  }

  renderFeedPosts(posts, authorMap);
}

export function setupLikeButton(postElement, postId, currentUserId, navigate) {
  const likeBtn = postElement.querySelector(".post__like-button");
  const likeIcon = likeBtn.querySelector(".post__like-icon");

  likeBtn.addEventListener("click", async () => {
    if (!currentUserId) {
      navigate("login");
      return;
    }

    try {
      const result = await api.likePost(postId, currentUserId);
      const updatedLikes = result.likes;
      const liked = updatedLikes.includes(currentUserId);

      likeIcon.src = liked
        ? "../assets/images/heart-fill.svg"
        : "../assets/images/heart-outline.svg";

      likeBtn.innerHTML = "";
      likeBtn.appendChild(likeIcon);
      likeBtn.insertAdjacentText("beforeend", ` ${updatedLikes.length}`);

      likeBtn.classList.toggle("post__like-button--active", liked);
    } catch (err) {
      console.error("Ошибка при попытке лайка:", err);
    }
  });
}

export function setupCommentsToggle(
  postElement,
  postId,
  postAuthorId,
  commentsContainer,
  navigate
) {
  const commentBtn = postElement.querySelector(".post__comment-button");

  commentBtn.addEventListener("click", async () => {
    const isVisible = commentsContainer.classList.contains(
      "comments-container--visible"
    );

    if (!isVisible) {
      commentsContainer.innerHTML = "";
      commentsContainer.classList.add("comments-container--visible");
      postElement.classList.add("post--sticky");
      commentBtn.classList.add("post__comment-button--active");

      commentsState[postId] = {};
      await loadComments(postId, commentsState[postId]);
      await showCommentsChunk(
        postId,
        commentsContainer,
        postAuthorId,
        navigate
      );
    } else {
      commentsContainer.innerHTML = "";
      commentsContainer.classList.remove("comments-container--visible");
      postElement.classList.remove("post--sticky");
      commentBtn.classList.remove("post__comment-button--active");

      if (commentsState[postId]) {
        commentsState[postId].shownCount = 0;
      }
    }

    const count = commentsState[postId]?.allComments?.length || 0;
    commentBtn.textContent = `Комментарии ${count}`;
  });
}
