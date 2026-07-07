import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIo } from "../../socket/index.js";
import * as service from "./service.js";

export const createComment = asyncHandler(async (req, res) => {
  const comment = await service.createComment(req.params.id, req.session.userId!, req.body.content);
  getIo().to(`post:${req.params.id}`).emit("comment:created", comment);
  res.status(201).json({ comment });
});

export const listComments = asyncHandler(async (req, res) => {
  const { cursorCreatedAt, cursorId, limit } = req.query as unknown as {
    cursorCreatedAt?: string;
    cursorId?: string;
    limit: number;
  };
  const cursor = cursorCreatedAt && cursorId ? { createdAt: new Date(cursorCreatedAt), id: cursorId } : null;
  const { comments, nextCursor } = await service.listComments(req.params.id, req.session.userId!, cursor, limit);
  res.json({ comments, nextCursor });
});

export const updateComment = asyncHandler(async (req, res) => {
  const comment = await service.updateComment(req.params.id, req.session.userId!, req.body.content);
  getIo().to(`post:${comment.postId}`).emit("comment:updated", comment);
  res.json({ comment });
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { postId } = await service.deleteComment(req.params.id, req.session.userId!);
  getIo().to(`post:${postId}`).emit("comment:deleted", { id: req.params.id, postId });
  res.status(204).send();
});
