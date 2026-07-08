import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIo } from "../../socket/index.js";
import { getAcceptedFriendIds } from "../friends/service.js";
import * as service from "./service.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await service.createPost(req.session.userId!, req.body);
  res.status(201).json({ post });

  // Fan out after responding — doesn't block the requester on socket work.
  // Audience mirrors the feed's own composition rule exactly (see
  // feed/service.ts): a public post still isn't broadcast to strangers, only
  // to friends + the author — a stranger only ever sees it by visiting the
  // author's profile directly, same as with any other visibility level.
  const io = getIo();
  if (post.visibility === "private") {
    io.to(`user:${post.authorId}`).emit("post:created", post);
  } else {
    const friendIds = await getAcceptedFriendIds(post.authorId);
    for (const friendId of friendIds) {
      io.to(`user:${friendId}`).emit("post:created", post);
    }
    io.to(`user:${post.authorId}`).emit("post:created", post);
  }
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
