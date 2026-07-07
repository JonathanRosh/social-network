import express from "express";
import cors from "cors";

export function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  return app;
}
