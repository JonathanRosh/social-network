import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { HttpError } from "../../utils/errors.js";
import { getViewablePostOrThrow } from "../posts/service.js";

const commentAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export interface CommentCursor {
  createdAt: Date;
  id: string;
}

export async function createComment(postId: string, authorId: string, content: string) {
  // Can only comment on a post you're allowed to see — reuses the exact same
  // visibility check the feed and single-post view use (getViewablePostOrThrow
  // 404s rather than 403s if the post isn't visible, same rationale as posts).
  await getViewablePostOrThrow(postId, authorId);
  return prisma.comment.create({
    data: { postId, authorId, content },
    include: { author: { select: commentAuthorSelect } },
  });
}

export async function updateComment(commentId: string, userId: string, content: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new HttpError(404, "Comment not found");
  if (comment.authorId !== userId) throw new HttpError(403, "Only the author can edit this comment");
  return prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { author: { select: commentAuthorSelect } },
  });
}

export async function deleteComment(commentId: string, userId: string): Promise<{ postId: string }> {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new HttpError(404, "Comment not found");
  if (comment.authorId !== userId) throw new HttpError(403, "Only the author can delete this comment");
  await prisma.comment.delete({ where: { id: commentId } });
  return { postId: comment.postId };
}

export async function listComments(postId: string, viewerId: string, cursor: CommentCursor | null, limit: number) {
  await getViewablePostOrThrow(postId, viewerId);

  // Oldest-first (ASC), unlike the feed's newest-first — comment threads
  // read chronologically. Cursor here means "give me the next batch after
  // this point", so the comparison direction flips to `>` accordingly.
  const cursorWhere: Prisma.CommentWhereInput | undefined = cursor
    ? {
        OR: [
          { createdAt: { gt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { gt: cursor.id } },
        ],
      }
    : undefined;

  const rows = await prisma.comment.findMany({
    where: cursorWhere ? { postId, ...cursorWhere } : { postId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit + 1,
    include: { author: { select: commentAuthorSelect } },
  });

  const hasMore = rows.length > limit;
  const comments = hasMore ? rows.slice(0, limit) : rows;
  const last = comments[comments.length - 1];
  const nextCursor: CommentCursor | null = hasMore && last ? { createdAt: last.createdAt, id: last.id } : null;

  return { comments, nextCursor };
}
