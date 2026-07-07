import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateBody } from "../../middleware/validate.js";
import { updateCommentSchema } from "./schema.js";
import { updateComment, deleteComment } from "./controller.js";

export const commentsRouter = Router();

commentsRouter.use(requireAuth);
commentsRouter.patch("/:id", validateBody(updateCommentSchema), updateComment);
commentsRouter.delete("/:id", deleteComment);
