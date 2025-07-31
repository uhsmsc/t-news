import express from 'express';
import { readData, writeData } from '../utils.js';

const router = express.Router();

// Получить все посты
router.get('/', async (req, res) => {
  const { authorId } = req.query;

  const posts = await readData('posts.json');
  const comments = await readData('comments.json');

  const filtered = authorId
    ? posts.filter(p => p.authorId === Number(authorId))
    : posts;

  const enrichedPosts = filtered.map(post => {
    const commentCount = comments.filter(c => c.postId === post.id).length;
    return { ...post, commentCount };
  });

  res.json(enrichedPosts.sort((a, b) => b.timestamp - a.timestamp));
});

// Получить один пост по ID
router.get('/posts/:id', async (req, res) => {
  const { id } = req.params;
  const posts = await readJSON('posts');
  const post = posts.find(p => p.id == id);
  if (!post) return res.status(404).json({ error: 'Пост не найден' });
  res.json(post);
});

// Создать новый пост
router.post('/', async (req, res) => {
  const { authorId, content } = req.body;

  if (!authorId || !content) {
    return res.status(400).json({ error: 'Поля обязательны' });
  }

  const posts = await readData('posts.json');
  const newPost = {
    id: Date.now(),
    authorId,
    content,
    likes: [],
    timestamp: Date.now()
  };

  posts.push(newPost);
  await writeData('posts.json', posts);

  res.status(201).json(newPost);
});

// лайк
router.post('/:id/like', async (req, res) => {
  const { id } = req.params;
  const userId = Number(req.body.userId);

  const posts = await readData('posts.json');
  const post = posts.find(p => p.id === Number(id));

  if (!post) {
    return res.status(404).json({ error: 'Пост не найден' });
  }

  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(u => u !== userId);
  } else {
    post.likes.push(userId);
  }

  await writeData('posts.json', posts);
  res.json(post);
});

// Удалить пост
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.query;

  const posts = await readData('posts.json');
  const post = posts.find(p => p.id === Number(id));

  if (!post || post.authorId !== Number(userId)) {
    return res.status(403).json({ error: 'Нет прав' });
  }

  const updated = posts.filter(p => p.id !== Number(id));
  await writeData('posts.json', updated);

  res.json({ message: 'Пост удалён' });
});

export default router;
