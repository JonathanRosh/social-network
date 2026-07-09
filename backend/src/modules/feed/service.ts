import { Prisma } from "@prisma/client";
import { prisma } from "../../db/prisma.js";
import { getAcceptedFriendIds } from "../friends/service.js";

export interface FeedCursor {
  createdAt: Date;
  id: string;
}

export type FeedScope = "friends" | "discover";

const feedAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export async function getFeed(viewerId: string, scope: FeedScope, cursor: FeedCursor | null, limit: number) {
  // "friends" and "discover" answer different questions and are kept as
  // separate scopes rather than one query: post *visibility* controls who
  // can view a post directly (e.g. via a profile), while feed *composition*
  // controls whose posts get pushed into a timeline. A stranger's public
  // post is visible on their profile but never appears in "friends" — only
  // "discover" surfaces posts from people the viewer isn't friends with.
  const visibilityWhere: Prisma.PostWhereInput =
    scope === "discover"
      ? { visibility: "public" }
      : {
          OR: [
            { authorId: viewerId },
            { authorId: { in: await getAcceptedFriendIds(viewerId) }, visibility: { in: ["public", "friends"] } },
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
