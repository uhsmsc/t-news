import express from 'express';
import { readData, writeData } from '../utils.js';

const router = express.Router();

// Получение данных пользователя по ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const users = await readData('users.json');
  const user = users.find(u => u.id === Number(id));

  if (!user) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const { password, ...safeUser } = user;
  res.json(safeUser);
});

// Подписка/отписка
router.post('/:id/follow', async (req, res) => {
  const { id } = req.params;       
  const { followerId } = req.body;  

  const users = await readData('users.json');
  const target = users.find(u => u.id === Number(id));
  const follower = users.find(u => u.id === Number(followerId));

  if (!target || !follower) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  if (target.followers.includes(followerId)) {
    // отписка
    target.followers = target.followers.filter(f => f !== followerId);
    follower.following = follower.following.filter(f => f !== Number(id));
  } else {
    // подписка
    target.followers.push(followerId);
    follower.following.push(Number(id));
  }

  await writeData('users.json', users);

  res.json({ message: 'Успешно', target });
});

// Обновление
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, bio } = req.body;

  const users = await readData('users.json');
  const userIndex = users.findIndex(u => u.id === Number(id));

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  if (typeof name === 'string' && name.trim()) {
    users[userIndex].name = name.trim();
  }
  if (typeof bio === 'string') {
    users[userIndex].bio = bio.trim();
  }

  await writeData('users.json', users);

  const { password, ...safeUser } = users[userIndex];
  res.json(safeUser);
});


export default router;
