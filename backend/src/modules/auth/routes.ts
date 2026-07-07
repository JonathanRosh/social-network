import { Router } from "express";
import { validateBody } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/requireAuth.js";
import { registerSchema, loginSchema } from "./schema.js";
import { register, login, logout, me } from "./controller.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);
