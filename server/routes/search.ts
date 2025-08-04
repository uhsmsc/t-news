import express, { Request, Response } from "express";
import { createLoadFn } from "../services/jsonStorage";
import { UserRecord } from "../models/user";
import { PostRecord } from "../models/post";

const router = express.Router();

const loadUsersJson = createLoadFn<UserRecord>("USERS_DATA");
const loadPostsJson = createLoadFn<PostRecord>("POSTS_DATA");

router.get("/", (req: Request, res: Response) => {
  const { query, type } = req.query;

  if (!query || !type) {
    return res.status(400).json({ error: "query и type обязательны" });
  }

  const q = String(query).toLowerCase();

  if (type === "users") {
    const users = loadUsersJson();
    const found = users.filter((u) =>
      u.name
        .toLowerCase()
        .split(/[^a-zA-Zа-яА-ЯёЁ]+/)
        .some((word) => word.startsWith(q))
    );
    return res.json(found.map(({ password, ...rest }) => rest));
  }

  if (type === "posts") {
    const posts = loadPostsJson();
    const found = posts
      .filter((p) =>
        p.content
          .toLowerCase()
          .split(/[^a-zA-Zа-яА-ЯёЁ]+/)
          .some((word) => word.startsWith(q))
      )
      .map((p) => ({
        ...p,
        commentCount: p.comments.length,
      }));
    return res.json(found);
  }

  res.status(400).json({ error: "Неверный type (ожидалось: users или posts)" });
});

export default router;
