import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { createPostSchema, updatePostSchema } from "./schema.js";
import * as controller from "./controller.js";
import { createCommentSchema, listCommentsQuerySchema } from "../comments/schema.js";
import { createComment, listComments } from "../comments/controller.js";

export const postsRouter = Router();

postsRouter.use(requireAuth);
postsRouter.post("/", validateBody(createPostSchema), controller.createPost);
postsRouter.get("/:id", controller.getPost);
postsRouter.patch("/:id", validateBody(updatePostSchema), controller.updatePost);
postsRouter.delete("/:id", controller.deletePost);

postsRouter.post("/:id/comments", validateBody(createCommentSchema), createComment);
postsRouter.get("/:id/comments", validateQuery(listCommentsQuerySchema), listComments);
