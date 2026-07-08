import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateBody, validateQuery } from "../../middleware/validate.js";
import { startConversationSchema, sendMessageSchema, listMessagesQuerySchema } from "./schema.js";
import * as controller from "./controller.js";

export const messagesRouter = Router();

messagesRouter.use(requireAuth);

messagesRouter.post("/conversations", validateBody(startConversationSchema), controller.startConversation);
messagesRouter.get("/conversations", controller.listConversations);
messagesRouter.get(
  "/conversations/:id/messages",
  validateQuery(listMessagesQuerySchema),
  controller.listMessages,
);
messagesRouter.post("/conversations/:id/messages", validateBody(sendMessageSchema), controller.sendMessage);
