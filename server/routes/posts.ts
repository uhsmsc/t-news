import express from "express";
import { Request, Response } from "express";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";
import {
  createPostComment,
  getAllPosts,
  deletePost,
  getAllPostComments,
  likePost,
  unlikePost,
  getPostById,
} from "../services/post";
import {
  createBadRequestError,
  createForbittenMessage,
  createNotFoundError,
} from "../models/error";
import { Comment, NewComment } from "../models/comment";
import { PostDto, NewPostDto } from "../models/post";
import { createPost } from "../services/post";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  try {
    const posts = getAllPosts();
    return res.status(200).json(posts);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({
      code: 500,
      message: message || "Internal Server Error",
    });
  }
});

router.get("/:postId/comments", (req: Request, res: Response) => {
  const { postId } = req.params;

  try {
    const comments = getAllPostComments(postId);
    return res.status(200).json(comments);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(404).json(createNotFoundError(message));
  }
});

router.use(authenticateJWT);

router.post("/", (req: Request, res: Response) => {
  const authUserId = (req as AuthenticatedRequest).user.userId;
  const { content } = req.body as NewPostDto;

  if (typeof content !== "string" || content.trim().length === 0) {
    return res
      .status(400)
      .json(createBadRequestError("Post content must be a non-empty string"));
  }

  try {
    const newPost = createPost(authUserId, { content: content.trim() });
    return res.status(201).json(newPost);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(500).json({
      code: 500,
      message: message || "Internal Server Error",
    });
  }
});

router.delete("/:postId", (req: Request, res: Response) => {
  const authUserId = (req as AuthenticatedRequest).user.userId;
  const postId = req.params.postId;
  let post: PostDto;

  try {
    post = getPostById(postId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    return res.status(404).json(createNotFoundError(message));
  }

  if (post.userId !== authUserId) {
    return res
      .status(403)
      .json(createForbittenMessage("You can only delete your own posts"));
  }

  deletePost(postId);

  return res.sendStatus(204);
});

router.post("/:postId/like", (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.userId;
  const postId = req.params.postId;

  try {
    likePost(userId, postId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    return res.status(404).json(createNotFoundError(message));
  }

  return res.sendStatus(201);
});

router.delete("/:postId/like", (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user.userId;
  const postId = req.params.postId;

  try {
    unlikePost(userId, postId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    return res.status(404).json(createNotFoundError(message));
  }

  return res.sendStatus(204);
});

router.post("/:postId/comments", (req: Request, res: Response) => {
  const postId = req.params.postId;
  const userId = (req as AuthenticatedRequest).user.userId;
  const commentDto = req.body as NewComment;

  if (typeof commentDto !== "object") {
    return res
      .status(400)
      .json(createBadRequestError("Comment data must be an object"));
  }

  if (typeof commentDto.content !== "string") {
    return res
      .status(400)
      .json(createBadRequestError("Comment content must be a string"));
  }

  if (commentDto.content.length === 0) {
    return res
      .status(400)
      .json(
        createBadRequestError("Comment content length must be greather than 0")
      );
  }
  let comment: Comment;

  try {
    comment = createPostComment(userId, postId, commentDto);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);

    return res.status(404).json(createNotFoundError(message));
  }

  return res.status(200).json(comment);
});

export default router;
