import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateQuery } from "../../middleware/validate.js";
import { feedQuerySchema } from "./schema.js";
import { getFeedHandler } from "./controller.js";

export const feedRouter = Router();

feedRouter.get("/", requireAuth, validateQuery(feedQuerySchema), getFeedHandler);
