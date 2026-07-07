import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateBody } from "../../middleware/validate.js";
import { updateProfileSchema } from "./schema.js";
import { getProfile, updateMe, getUserPosts } from "./controller.js";

export const usersRouter = Router();

// Note: PATCH /me is registered before GET /:username so it can never be
// shadowed, though Express also disambiguates by HTTP method here anyway.
usersRouter.patch("/me", requireAuth, validateBody(updateProfileSchema), updateMe);
usersRouter.get("/:username", requireAuth, getProfile);
usersRouter.get("/:username/posts", requireAuth, getUserPosts);
