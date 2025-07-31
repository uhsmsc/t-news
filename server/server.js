import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import searchRoutes from './routes/search.js';

const app = express();
const PORT = 3001;

const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'client')));

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search', searchRoutes);

app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

app.listen(PORT, () => {
  console.log(`Сервер работает на http://localhost:${PORT}`);
});
