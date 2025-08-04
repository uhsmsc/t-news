import { api } from "../services/api.js";

export function setupLikeButton(
  postElement,
  postId,
  currentUserId,
  navigate,
  initialLikes = []
) {
  const likeBtn = postElement.querySelector(".post__like-button");
  const likeIcon = likeBtn.querySelector(".post__like-icon");

  let updatedLikes = [...initialLikes];

  const isInitiallyLiked = updatedLikes.includes(currentUserId);
  updateLikeButtonUI(isInitiallyLiked, updatedLikes.length);

  likeBtn.addEventListener("click", async () => {
    if (!currentUserId) {
      navigate("login");
      return;
    }

    const isLikedNow = updatedLikes.includes(currentUserId);

    try {
      if (isLikedNow) {
        await api.unlikePost(postId);
        updatedLikes = updatedLikes.filter((id) => id !== currentUserId);
      } else {
        await api.likePost(postId);
        updatedLikes.push(currentUserId);
      }

      updateLikeButtonUI(!isLikedNow, updatedLikes.length);
    } catch (err) {
      console.error("Ошибка при попытке лайка:", err);
    }
  });

  function updateLikeButtonUI(liked, count) {
    likeIcon.src = liked
      ? "../assets/images/heart-fill.svg"
      : "../assets/images/heart-outline.svg";

    likeBtn.innerHTML = "";
    likeBtn.appendChild(likeIcon);
    likeBtn.insertAdjacentText("beforeend", ` ${count}`);

    likeBtn.classList.toggle("post__like-button--active", liked);
  }
}
