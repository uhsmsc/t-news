import express from 'express';
import multer from 'multer';
import path from 'path';
import { readData, writeData } from '../utils.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');  // папка для загрузок
  },
  filename: (req, file, cb) => {
    // уникальное имя файла: timestamp + оригинальное расширение
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId обязателен' });

  try {
    const users = await readData('users.json');
    const user = users.find(u => u.id.toString() === userId.toString());
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

    user.avatar = `/uploads/${req.file.filename}`;

    await writeData('users.json', users);

    res.json({ message: 'Аватар обновлён', avatar: user.avatar });
  } catch (err) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;
