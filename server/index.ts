import express from "express";
import bodyParser from "body-parser";
import path from "path";

import { loadConfig, getEnv } from "./utils/config";

import userRouter from "./routes/users";
import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import commentsRouter from "./routes/comments";
import searchRouter from "./routes/search";

loadConfig();

const app = express();
const PORT = getEnv("PORT");

app.use(bodyParser.json());

const apiRouter = express.Router();

app.use('/uploads', express.static(path.join(process.cwd(), 'server', 'uploads')));

apiRouter.use("/search", searchRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/posts", postsRouter);
apiRouter.use("/comments", commentsRouter);

app.use("/api", apiRouter);

const clientPath = path.resolve(__dirname, "../client");
app.use(express.static(clientPath));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
