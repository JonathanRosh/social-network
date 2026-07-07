import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { registerSchema, loginSchema } from "./schema.js";
import { register, login, logout, me } from "./controller.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, validateBody(registerSchema), register);
authRouter.post("/login", authRateLimit, validateBody(loginSchema), login);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);
