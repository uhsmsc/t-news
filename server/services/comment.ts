import { createLoadFn, createSaveFn } from "../services/jsonStorage";
import { Comment, NewComment } from "../models/comment";
import { generateId } from "../utils/generate_id";
import { deleteCommentFromPost } from "./post";

const loadCommentsJson = createLoadFn<Comment>("COMMENTS_DATA");
const saveCommentsJson = createSaveFn<Comment>("COMMENTS_DATA");

export function getComments(): Comment[] {
  return loadCommentsJson();
}

export function getCommentById(id: string): Comment {
  const data = loadCommentsJson();
  const comment = data.find((c) => c.id === id);
  if (!comment) {
    console.warn(`Comment with id ${id} not found. Comments loaded:`, data.map(c => c.id));
    throw new Error(`Comment with id ${id} not found`);
  }
  return comment;
}

export function createComment(userId: string, commentDto: NewComment): Comment {
  const comment: Comment = {
    userId,
    content: commentDto.content,
    id: generateId(),
  };

  const data = loadCommentsJson();

  data.push(comment);

  saveCommentsJson(data);

  return comment;
}

export function deleteComment(userId: string, commentId: string, postId: string) {
  const data = loadCommentsJson();

  const comment = data.find((c) => c.id === commentId);

  if (!comment) {
    throw new Error(`Comment with id ${commentId} not found`);
  }

  if (comment.userId !== userId) {
    throw new Error("You can only delete your own comments");
  }

  saveCommentsJson(data.filter((c) => c.id !== commentId));

  deleteCommentFromPost(postId, commentId);
}
