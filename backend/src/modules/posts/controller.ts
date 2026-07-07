import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIo } from "../../socket/index.js";
import { getAcceptedFriendIds } from "../friends/service.js";
import * as service from "./service.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await service.createPost(req.session.userId!, req.body);
  res.status(201).json({ post });

  // Fan out after responding — doesn't block the requester on socket work.
  // Audience mirrors the feed's own visibility rule exactly:
  //   public  -> every connected client (visibility genuinely means "anyone")
  //   friends -> the author's accepted friends' personal rooms
  //   private -> nobody but the author
  // The author's own room is always included so their other open tabs/
  // sessions pick up the new post immediately too.
  const io = getIo();
  if (post.visibility === "public") {
    io.emit("post:created", post);
  } else if (post.visibility === "friends") {
    const friendIds = await getAcceptedFriendIds(post.authorId);
    for (const friendId of friendIds) {
      io.to(`user:${friendId}`).emit("post:created", post);
    }
    io.to(`user:${post.authorId}`).emit("post:created", post);
  } else {
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
