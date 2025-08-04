import express from "express";
import { Request, Response } from "express";
import { AuthenticatedRequest, authenticateJWT } from "../middleware/auth";
import { deleteComment } from "../services/comment";
import { createBadRequestError } from "../models/error";

const router = express.Router();

router.use(authenticateJWT);

router.delete("/:commentId", (req: Request, res: Response) => {
  const commentId = req.params.commentId;
  const userId = (req as AuthenticatedRequest).user.userId;
  const postId = req.query.postId as string;

  if (!postId) {
    return res.status(400).json(createBadRequestError("postId is required"));
  }

  try {
    deleteComment(userId, commentId, postId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(400).json(createBadRequestError(message));
  }

  return res.sendStatus(204);
});


export default router;
