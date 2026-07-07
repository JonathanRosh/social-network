import { asyncHandler } from "../../utils/asyncHandler.js";
import * as service from "./service.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await service.createPost(req.session.userId!, req.body);
  res.status(201).json({ post });
});

export const updatePost = asyncHandler(async (req, res) => {
  const post = await service.updatePost(req.params.id, req.session.userId!, req.body);
  res.json({ post });
});

export const deletePost = asyncHandler(async (req, res) => {
  await service.deletePost(req.params.id, req.session.userId!);
  res.status(204).send();
});

export const getPost = asyncHandler(async (req, res) => {
  const post = await service.getViewablePostOrThrow(req.params.id, req.session.userId!);
  res.json({ post });
});
