import { asyncHandler } from "../../utils/asyncHandler.js";
import { getIo } from "../../socket/index.js";
import { getAcceptedFriendIds } from "../friends/service.js";
import * as service from "./service.js";

export const createPost = asyncHandler(async (req, res) => {
  const post = await service.createPost(req.session.userId!, req.body);
  res.status(201).json({ post });

  // Fan out after responding — doesn't block the requester on socket work.
  // Two distinct events for the two distinct feeds (see feed/service.ts):
  //   "post:created" — the friends-feed audience: friends of the author plus
  //     the author's own other tabs. Sent for any non-private post.
  //   "post:created:public" — the discover-feed audience: literally everyone
  //     connected, sent only when the post is actually public. A friend
  //     receives both for a friend's public post, correctly landing it in
  //     both of their feeds; a stranger only ever receives the second one.
  const io = getIo();
  if (post.visibility === "private") {
    io.to(`user:${post.authorId}`).emit("post:created", post);
  } else {
    const friendIds = await getAcceptedFriendIds(post.authorId);
    for (const friendId of friendIds) {
      io.to(`user:${friendId}`).emit("post:created", post);
    }
    io.to(`user:${post.authorId}`).emit("post:created", post);

    if (post.visibility === "public") {
      io.emit("post:created:public", post);
    }
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
