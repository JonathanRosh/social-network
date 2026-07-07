import rateLimit from "express-rate-limit";

/** Blunts brute-force login/registration attempts. Keyed by IP (default). */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});
