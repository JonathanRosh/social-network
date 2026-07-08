import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIo } from "../../socket/index.js";
import * as service from "./service.js";

export const startConversation = asyncHandler(async (req, res) => {
  const conversation = await service.getOrCreateConversation(req.session.userId!, req.body.friendId);
  res.status(201).json({ conversation });
});

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await service.listConversations(req.session.userId!);
  res.json({ conversations });
});

export const listMessages = asyncHandler(async (req, res) => {
  const { cursorCreatedAt, cursorId, limit } = req.query as unknown as {
    cursorCreatedAt?: string;
    cursorId?: string;
    limit: number;
  };
  const cursor = cursorCreatedAt && cursorId ? { createdAt: new Date(cursorCreatedAt), id: cursorId } : null;
  const { messages, nextCursor } = await service.listMessages(req.params.id, req.session.userId!, cursor, limit);
  res.json({ messages, nextCursor });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await service.sendMessage(req.params.id, req.session.userId!, req.body.content);
  getIo().to(`conversation:${req.params.id}`).emit("message:created", message);
  res.status(201).json({ message });
});
