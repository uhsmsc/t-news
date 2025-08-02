import { api } from "../services/api.js";

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