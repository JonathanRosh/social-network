import { Prisma, type Post, type PostVisibility } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";
import { areFriends } from "../friends/service.js";

const postAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export async function createPost(authorId: string, data: { content: string; visibility: PostVisibility }) {
  // Includes the author (safe fields only) so the realtime post:created
  // payload and the REST response both already match the feed's shape —
  // no extra round trip needed on either the emitting client or recipients.
  return prisma.post.create({
    data: { authorId, ...data },
    include: { author: { select: postAuthorSelect } },
  });
}

/** Whether viewerId is allowed to see this post, given its visibility and author. */
export async function canViewPost(viewerId: string, post: Post): Promise<boolean> {
  if (post.authorId === viewerId) return true;
  if (post.visibility === "public") return true;
  if (post.visibility === "private") return false;
  return areFriends(viewerId, post.authorId);
}

export async function getViewablePostOrThrow(postId: string, viewerId: string): Promise<Post> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  // 404 (not 403) whether the post doesn't exist or simply isn't visible to
  // this viewer — deliberately avoids leaking that a private/friends-only
  // post exists at all to someone who can't see it.
  if (!post || !(await canViewPost(viewerId, post))) {
    throw new HttpError(404, "Post not found");
  }
  return post;
}

export async function updatePost(
  postId: string,
  userId: string,
  data: { content?: string; visibility?: PostVisibility },
): Promise<Post> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404, "Post not found");
  if (post.authorId !== userId) throw new HttpError(403, "Only the author can edit this post");
  return prisma.post.update({ where: { id: postId }, data });
}

export async function deletePost(postId: string, userId: string): Promise<void> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new HttpError(404, "Post not found");
  if (post.authorId !== userId) throw new HttpError(403, "Only the author can delete this post");
  await prisma.post.delete({ where: { id: postId } });
}

/** Posts by a given username, visibility-filtered for the viewer. Used by the profile page. */
export async function listUserPosts(username: string, viewerId: string): Promise<Post[]> {
  const author = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!author) throw new HttpError(404, "User not found");

  const isSelf = author.id === viewerId;
  const isFriend = isSelf ? false : await areFriends(viewerId, author.id);

  const visibleStatuses: PostVisibility[] = isSelf
    ? ["public", "friends", "private"]
    : isFriend
      ? ["public", "friends"]
      : ["public"];

  return prisma.post.findMany({
    where: { authorId: author.id, visibility: { in: visibleStatuses } },
    orderBy: { createdAt: "desc" },
  });
}
