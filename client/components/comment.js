export function showComment(comment, author, currentUser, postAuthorId) {
  const canDelete = !!currentUser && currentUser.id === postAuthorId;

  return `
    <div class="comment" data-comment-id="${comment.id}">
      <div class="comment__header">
        <img class="comment__avatar" src="${author.avatar}" alt="аватар">
        <h3 class="comment__author">${author.name}</h3>
        ${canDelete ? `
          <button class="comment__delete-button" title="Удалить комментарий">
            <img src="/assets/images/container.svg" alt="Удалить">
          </button>
        ` : ""}
      </div>
      <div class="comment__content">${comment.content}</div>
    </div>
  `;
}
