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
  // Two distinct, deliberately separate views rather than one algorithm
  // trying to serve both jobs:
  //   "friends" — the assignment's required personalized feed: the viewer's
  //     own posts plus their friends' posts (public or friends-only level).
  //     A stranger's public post never appears here, even though it's
  //     viewable if you visit their profile directly — visibility and feed
  //     composition are different questions.
  //   "discover" — every public post from anyone, specifically so there's a
  //     way to find new people to friend without already knowing their
  //     username. Explicitly not required by the assignment, added for
  //     practical usability.
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
