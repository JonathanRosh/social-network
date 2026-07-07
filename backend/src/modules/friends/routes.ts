import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateBody } from "../../middleware/validate.js";
import { sendRequestSchema } from "./schema.js";
import * as controller from "./controller.js";

export const friendsRouter = Router();

friendsRouter.use(requireAuth);

friendsRouter.post("/requests", validateBody(sendRequestSchema), controller.sendRequest);
friendsRouter.get("/requests", controller.listRequests);
friendsRouter.post("/requests/:id/accept", controller.acceptRequest);
friendsRouter.post("/requests/:id/decline", controller.declineRequest);
friendsRouter.delete("/requests/:id", controller.cancelRequest);

friendsRouter.get("/", controller.listMyFriends);
friendsRouter.delete("/:userId", controller.removeFriendHandler);
