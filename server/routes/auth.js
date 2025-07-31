import express from "express";
import { readData, writeData } from "../utils.js";

const router = express.Router();

// Регистрация
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Логин и пароль обязательны" });
  }

  const users = await readData("users.json");
  const existingUser = users.find((u) => u.username === username);

  if (existingUser) {
    return res.status(409).json({ error: "Пользователь уже существует" });
  }

  const newUser = {
    id: Date.now(),
    username,
    password,
    name: username,
    bio: "",
    avatar: "/uploads/default.svg",
    followers: [],
    following: [],
  };

  users.push(newUser);
  await writeData("users.json", users);

  res.status(201).json({
    message: "Регистрация прошла успешно",
    user: { id: newUser.id, username },
  });
});

// Вход
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const users = await readData("users.json");
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: "Неверный логин или пароль" });
  }

  res.json({
    message: "Успешный вход",
    token: `fake-token-${user.id}`,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
    },
  });
});

export default router;
