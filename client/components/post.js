export function createPostCard(post, author, currentUserId) {
  const liked = post.likes.includes(currentUserId);
  const iconSrc = liked
    ? "../assets/images/heart-fill.svg"
    : "../assets/images/heart-outline.svg";

  return `
    <article class="post" data-id="${post.id}">
      <div class="post__header">
        <img src="${author.avatar}" alt="аватар" class="post__avatar">
        <h3 class="post__username">${author.name}</h3>
      </div>
      <p class="post__text">${post.content}</p>
      <div class="post__footer">
        <button class="post__like-button" data-liked="${liked}">
          <img src="${iconSrc}" class="post__like-icon"> ${post.likes.length}
        </button>
        <button class="post__comment-button" data-post-id="${post.id}">
          Комментарии ${post.commentCount ?? 0}
        </button>
      </div>
    </article>
  `;
}
