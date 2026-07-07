import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  // Whether to mark the session cookie Secure (HTTPS-only). Defaults to false
  // because this stack has no TLS termination (see src/session.ts for why).
  COOKIE_SECURE: z
    .string()
    .default("false")
    .transform((v) => v === "true"),
});

export const env = envSchema.parse(process.env);
