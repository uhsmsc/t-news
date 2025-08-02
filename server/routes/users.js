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

// POST /users/:id/follow
router.post('/:id/follow', async (req, res) => {
  const { id } = req.params;           
  const { followerId } = req.body;      

  const users = await readData('users.json');

  const target = users.find(u => u.id === Number(id));
  const follower = users.find(u => u.id === Number(followerId));

  if (!target || !follower) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const targetIdNum = Number(id);
  const followerIdNum = Number(followerId);

  let isSubscribed = false;

  if (target.followers.includes(followerIdNum)) {
    // Отписка
    target.followers = target.followers.filter(f => f !== followerIdNum);
    follower.following = follower.following.filter(f => f !== targetIdNum);
    isSubscribed = false;
  } else {
    // Подписка
    target.followers.push(followerIdNum);
    follower.following.push(targetIdNum);
    isSubscribed = true;
  }

  await writeData('users.json', users);

  res.json({
    message: isSubscribed ? 'Подписка оформлена' : 'Подписка отменена',
    isSubscribed,
    followersCount: target.followers.length
  });
});

// GET /users/:id/is-following/:followerId
router.get('/:id/is-following/:followerId', async (req, res) => {
  const { id, followerId } = req.params;
  const users = await readData('users.json');

  const target = users.find(u => u.id === Number(id));
  if (!target) {
    return res.status(404).json({ error: 'Пользователь не найден' });
  }

  const isSubscribed = target.followers.includes(Number(followerId));
  res.json({ isSubscribed, followersCount: target.followers.length });
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
