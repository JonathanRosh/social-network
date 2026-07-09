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
  // Visibility (who can view a post directly) and feed composition (whose posts
  // land in a timeline) are different questions. A stranger's public post is
  // visible on their profile but stays out of "friends"; only "discover" shows it.
  const visibilityWhere: Prisma.PostWhereInput =
    scope === "discover"
      ? { visibility: "public" }
      : {
          OR: [
            { authorId: viewerId },
            { authorId: { in: await getAcceptedFriendIds(viewerId) }, visibility: { in: ["public", "friends"] } },
          ],
        };

  // (createdAt, id) tuple comparison, decomposed into an OR since Prisma has no
  // tuple comparator. Cursor pagination over offset because this is a live feed:
  // offset pagination duplicates or skips items when new posts land mid-fetch.
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
