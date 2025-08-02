import express from "express";
import { readData, writeData } from "../utils.js";

const router = express.Router();

// Получить комментарии к посту
router.get("/:postId", async (req, res) => {
  const { postId } = req.params;
  const comments = await readData("comments.json");
  const filtered = comments
    .filter((c) => c.postId === Number(postId))
    .sort((a, b) => a.timestamp - b.timestamp);
  res.json(filtered);
});

// Добавить комментарий
router.post("/", async (req, res) => {
  const { postId, authorId, content } = req.body;

  if (!postId || !authorId || !content) {
    return res.status(400).json({ error: "Все поля обязательны" });
  }

  const comments = await readData("comments.json");

  const newComment = {
    id: Date.now(),
    postId,
    authorId,
    content,
    timestamp: Date.now(),
  };

  comments.push(newComment);
  await writeData("comments.json", comments);

  res.status(201).json(newComment);
});

// Удалить комментарий (только автор поста)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const userId = Number(req.query.userId);

  const comments = await readData("comments.json");
  const posts = await readData("posts.json");

  const comment = comments.find((c) => c.id === Number(id));
  if (!comment) {
    return res.status(404).json({ error: "Комментарий не найден" });
  }

  const post = posts.find((p) => p.id === comment.postId);
  if (!post) {
    return res.status(404).json({ error: "Пост не найден" });
  }

  if (comment.authorId !== userId) {
    return res.status(403).json({ error: "Нет прав" });
  }

  const updated = comments.filter((c) => c.id !== Number(id));
  await writeData("comments.json", updated);

  res.json({ message: "Комментарий удалён" });
});


export default router;
