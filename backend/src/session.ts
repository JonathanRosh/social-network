import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { env } from "./config/env.js";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

const pgPool = new Pool({ connectionString: env.DATABASE_URL });
const PgSession = connectPgSimple(session);

export const sessionMiddleware = session({
  store: new PgSession({ pool: pgPool, createTableIfMissing: true }),
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    // Deliberately not tied to NODE_ENV: this stack is served over plain HTTP
    // (Docker Compose on localhost, no TLS termination anywhere). express-session
    // silently refuses to ever set the cookie when secure=true on a non-HTTPS
    // connection, which breaks login entirely. Behind real HTTPS in production,
    // this should be `secure: true` (and cookie.sameSite tightened if cross-site).
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});
