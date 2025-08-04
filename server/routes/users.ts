import express from "express";
import { Request, Response } from "express";
import { NewUserDto, UpdateUserDto, UserDto } from "../models/user";
import { AuthenticatedRequest, authenticateJWT } from "../middleware/auth";
import {
  createUser,
  getUsers,
  getUserById,
  patchUser,
  isFollowing,
  followUser,
  unfollowUser,
} from "../services/user";
import {
  createBadRequestError,
  createForbittenMessage,
  createNotFoundError,
} from "../models/error";
import { createPost, getPostsByUserId } from "../services/post";
import { NewPostDto } from "../models/post";

const router = express.Router();

router.use((req, res, next) => {
  const isRegistration = req.method === "POST" && req.path === "/";
  const isUserById =
    req.method === "GET" && /^\/[a-zA-Z0-9_-]+$/.test(req.path);
  const isUserPosts =
    req.method === "GET" && /^\/[a-zA-Z0-9_-]+\/posts$/.test(req.path);
  const isGetUsers = req.method === "GET" && req.path === "/";

  if (
    isRegistration ||
    isGetUsers ||
    (isUserById && req.path !== "/me") ||
    isUserPosts
  ) {
    return next();
  }

  authenticateJWT(req, res, next);
});

router.get("/me", (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.userId;

  if (!userId) {
    return res
      .status(401)
      .json(createBadRequestError("User is not authenticated"));
  }

  try {
    const user = getUserById(userId);
    return res.status(200).json(user);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(404).json(createNotFoundError(message));
  }
});

router.post("/", (req: Request, res: Response) => {
  const { username, password } = req.body as NewUserDto;

  if (typeof username !== "string" || username.length < 3) {
    return res
      .status(400)
      .json(
        createBadRequestError(
          "Username must be a string with at least 3 characters"
        )
      );
  }

  if (typeof password !== "string" || password.length < 4) {
    return res
      .status(400)
      .json(createBadRequestError("Password must be at least 4 characters"));
  }

  let user: UserDto;
  try {
    user = createUser(req.body as NewUserDto);
  } catch (e) {
    return res.status(400).json(createBadRequestError("User already exists"));
  }

  res.status(201).json(user);
});

router.get("/", (req: Request, res: Response) => {
  const users = getUsers();

  res.status(200).json(users);
});

router.get("/:userId", (req: Request, res: Response) => {
  const userId = req.params.userId;

  let user: UserDto;

  try {
    user = getUserById(userId);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    
    return res.status(404).json(createNotFoundError(message));
  }

  res.status(200).json(user);
});

router.patch("/:userId", (req: Request, res: Response) => {
  const userId = req.params.userId;
  const updatedUser = req.body as UpdateUserDto;

  if (typeof updatedUser !== "object") {
    return res
      .status(400)
      .json(createBadRequestError("Request body must be an object"));
  }

  if (
    updatedUser.name !== undefined &&
    typeof updatedUser.name !== "string"
  ) {
    return res
      .status(400)
      .json(createBadRequestError("Username must be a string"));
  }

  if (updatedUser.bio !== undefined && typeof updatedUser.bio !== "string") {
    return res.status(400).json(createBadRequestError("Bio must be a string"));
  }

  if (
    updatedUser.avatar !== undefined &&
    typeof updatedUser.avatar !== "string"
  ) {
    return res
      .status(400)
      .json(createBadRequestError("Avatar must be a string"));
  }

  let user: UserDto;

  try {
    user = patchUser(userId, updatedUser);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(404).json(createNotFoundError(message));
  }

  res.status(200).json(user);
});

router.get("/:userId/posts", (req: Request, res: Response) => {
  const userId = req.params.userId;

  const posts = getPostsByUserId(userId);

  return res.status(200).json(posts);
});

router.post("/:userId/posts", (req: Request, res: Response) => {
  const userId = req.params.userId;
  const authUserId = (req as AuthenticatedRequest).user.userId;
  const postDto = req.body as NewPostDto;

  if (typeof postDto !== "object") {
    return res
      .status(400)
      .json(createBadRequestError("Post data must be an object"));
  }

  if (typeof postDto.content !== "string") {
    return res
      .status(400)
      .json(createBadRequestError("Post content must be a string"));
  }

  if (postDto.content.length === 0) {
    return res
      .status(400)
      .json(
        createBadRequestError("Post content length must be greater than 0")
      );
  }

  if (userId !== authUserId) {
    return res
      .status(403)
      .json(
        createForbittenMessage(
          "You cannot create a post on behalf of someone else (╯°□°)╯︵ ┻━┻"
        )
      );
  }

  const post = createPost(userId, postDto);

  return res.status(201).json(post);
});

router.post("/:userId/follow", (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const currentUserId = authReq.user?.userId;
  const targetId = req.params.userId;

  if (!currentUserId) {
    return res
      .status(401)
      .json(createBadRequestError("User is not authenticated"));
  }

  try {
    followUser(currentUserId, targetId);
    const targetUser = getUserById(targetId);
    res.status(200).json({
      isSubscribed: true,
      followersCount: targetUser.followers.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(400).json(createBadRequestError(message));
  }
});

router.post("/:userId/unfollow", (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const currentUserId = authReq.user?.userId;
  const targetId = req.params.userId;

  if (!currentUserId) {
    return res
      .status(401)
      .json(createBadRequestError("User is not authenticated"));
  }

  try {
    unfollowUser(currentUserId, targetId);
    const targetUser = getUserById(targetId);
    res.status(200).json({
      isSubscribed: false,
      followersCount: targetUser.followers.length,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(400).json(createBadRequestError(message));
  }
});

router.get("/:userId/is-following", (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const currentUserId = authReq.user?.userId;
  const targetId = req.params.userId;

  if (!currentUserId) {
    return res
      .status(401)
      .json(createBadRequestError("User is not authenticated"));
  }

  try {
    const following = isFollowing(currentUserId, targetId);
    res.status(200).json({
      isSubscribed: following,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return res.status(400).json(createBadRequestError(message));
  }
});

export default router;
