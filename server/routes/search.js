import express from "express";
import { readData } from "../utils.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { query, type } = req.query;

  if (!query || !type) {
    return res.status(400).json({ error: "query и type обязательны" });
  }

  const q = query.toLowerCase();

  if (type === "users") {
    const users = await readData("users.json");
    if (!q) {
      return res.json(users.map(({ password, ...rest }) => rest));
    }
    const found = users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
    return res.json(found.map(({ password, ...rest }) => rest));
  }

  if (type === "posts") {
    const posts = await readData("posts.json");
    const found = posts.filter((p) => p.content.toLowerCase().includes(q));
    return res.json(found);
  }

  res.status(400).json({ error: "Неверный type (ожидалось: users или posts)" });
});

export default router;
