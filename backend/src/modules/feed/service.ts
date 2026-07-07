import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { getAcceptedFriendIds } from "../friends/service.js";

export interface FeedCursor {
  createdAt: Date;
  id: string;
}

const feedAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export async function getFeed(viewerId: string, cursor: FeedCursor | null, limit: number) {
  const friendIds = await getAcceptedFriendIds(viewerId);

  const visibilityWhere: Prisma.PostWhereInput = {
    OR: [
      { authorId: viewerId },
      { visibility: "public" },
      { visibility: "friends", authorId: { in: friendIds } },
    ],
  };

  // Cursor pagination via (createdAt, id) as a compound "less than" tuple —
  // decomposed into an OR since Prisma has no native tuple comparator.
  // Chosen over offset pagination specifically because this is a *live* feed:
  // offset pagination duplicates/skips items when new posts land between
  // page fetches, which cursor pagination is immune to.
  const cursorWhere: Prisma.PostWhereInput | undefined = cursor
    ? {
        OR: [
          { createdAt: { lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, id: { lt: cursor.id } },
        ],
      }
    : undefined;

  const rows = await prisma.post.findMany({
    where: cursorWhere ? { AND: [visibilityWhere, cursorWhere] } : visibilityWhere,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1, // fetch one extra to know whether there's a next page
    include: { author: { select: feedAuthorSelect } },
  });

  const hasMore = rows.length > limit;
  const posts = hasMore ? rows.slice(0, limit) : rows;
  const last = posts[posts.length - 1];
  const nextCursor: FeedCursor | null = hasMore && last ? { createdAt: last.createdAt, id: last.id } : null;

  return { posts, nextCursor };
}
