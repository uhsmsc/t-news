import { escapeHtml } from "../utils/escapeHtml.js";

export function createCommentCard(comment, author) {
  return `
    <div class="comment" data-comment-id="${comment.id}" data-author-id="${author.id}">
      <div class="comment__header">
        <img src="${escapeHtml(author.avatar)}" alt="avatar" class="comment__avatar" />
        <h3 class="comment__author" data-user-id="${author.id}">${escapeHtml(author.name)}</h3>
      </div>
      <div class="comment__content">${escapeHtml(comment.content)}</div>
    </div>
  `;
}
