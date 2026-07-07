import express from "express";
import cors from "cors";
import { sessionMiddleware } from "./session.js";
import { authRouter } from "./modules/auth/routes.js";
import { usersRouter } from "./modules/users/routes.js";
import { friendsRouter } from "./modules/friends/routes.js";
import { postsRouter } from "./modules/posts/routes.js";
import { feedRouter } from "./modules/feed/routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }));
  app.use(express.json());
  app.use(sessionMiddleware);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/friends", friendsRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/feed", feedRouter);

  app.use(errorHandler);

  return app;
}
