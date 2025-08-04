import { createLoadFn, createSaveFn } from "../services/jsonStorage";
import { PostDto, NewPostDto, PostRecord } from "../models/post";
import { Comment, NewComment } from "../models/comment";
import { getComments, getCommentById, createComment } from "./comment";
import { generateId } from "../utils/generate_id";

const loadPostsJson = createLoadFn<PostRecord>("POSTS_DATA");
const savePostJson = createSaveFn<PostRecord>("POSTS_DATA");
const loadCommentsJson = createLoadFn<Comment>("COMMENTS_DATA");
const saveCommentsJson = createSaveFn<Comment>("COMMENTS_DATA");

export function getAllPosts(): (Omit<PostRecord, "comments"> & { commentCount: number })[] {
  return loadPostsJson().map((p) => ({
    ...p,
    commentCount: p.comments.length,
  }));
}

export function getPostsByUserId(userId: string): (Omit<PostRecord, "comments"> & { commentCount: number })[] {
  return loadPostsJson()
    .filter((p) => p.userId === userId)
    .map((p) => ({
      ...p,
      commentCount: p.comments.length,
    }));
}

export function getPostById(postId: string): PostDto {
  const data = loadPostsJson();
  const post = data.find((p) => p.id === postId);

  if (!post) {
    throw new Error(`Post with id ${postId} not found`);
  }

  const comments = post.comments.map((id) => getCommentById(id));

  return {
    ...post,
    comments,
  };
}

export function createPost(userId: string, postDto: NewPostDto) {
  const post: PostRecord = {
    userId,
    comments: [],
    likes: [],
    content: postDto.content,
    id: generateId(),
  };

  const allPosts = loadPostsJson();

  allPosts.push(post);

  savePostJson(allPosts);

  return {
    ...post,
    commentCount: 0,
  };
}

export function deletePost(postId: string) {
  const posts = loadPostsJson();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    throw new Error(`Post with id ${postId} not found`);
  }

  const comments = loadCommentsJson();
  const updatedComments = comments.filter(
    (c) => !post.comments.includes(c.id)
  );
  saveCommentsJson(updatedComments);

  const updatedPosts = posts.filter((p) => p.id !== postId);
  savePostJson(updatedPosts);
}

export function likePost(userId: string, postId: string) {
  const data = loadPostsJson();
  const postIndex = data.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    throw new Error(`Post with id ${postId} not found`);
  }

  const post = data[postIndex];

  if (post.likes.includes(userId)) {
    return;
  }

  post.likes.push(userId);

  data[postIndex] = post;

  savePostJson(data);
}

export function unlikePost(userId: string, postId: string) {
  const data = loadPostsJson();
  const postIndex = data.findIndex((p) => p.id === postId);

  if (postIndex === -1) {
    throw new Error(`Post with id ${postId} not found`);
  }

  const post = data[postIndex];

  post.likes = post.likes.filter((id) => id !== userId);

  data[postIndex] = post;

  savePostJson(data);
}

export function getAllPostComments(postId: string): Comment[] {
  const post = loadPostsJson().find((p) => p.id === postId);
  if (!post) {
    throw new Error(`Post with id ${postId} not found`);
  }

  return post.comments.map((commentId) => getCommentById(commentId));
}

export function createPostComment(
  userId: string,
  postId: string,
  commentDto: NewComment
): Comment & { postId: string } {
  const posts = loadPostsJson();
  const post = posts.find((p) => p.id === postId);

  if (!post) {
    throw new Error(`Post with id ${postId} not found`);
  }

  const comment = createComment(userId, commentDto);
  post.comments.push(comment.id);

  savePostJson(posts);

  return {
    ...comment,
    postId,
  };
}

export function deleteCommentFromPost(postId: string, commentId: string) {
  const posts = loadPostsJson();
  const postIndex = posts.findIndex((p) => p.id === postId);
  
  if (postIndex === -1) {
    throw new Error(`Post with id ${postId} not found`);
  }
  
  const post = posts[postIndex];

  post.comments = post.comments.filter((id) => id !== commentId);

  posts[postIndex] = post;

  savePostJson(posts);
}

