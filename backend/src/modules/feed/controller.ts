import { asyncHandler } from "../../utils/asyncHandler.js";
import { getFeed, type FeedScope } from "./service.js";

export const getFeedHandler = asyncHandler(async (req, res) => {
  const { scope, cursorCreatedAt, cursorId, limit } = req.query as unknown as {
    scope: FeedScope;
    cursorCreatedAt?: string;
    cursorId?: string;
    limit: number;
  };

  const cursor = cursorCreatedAt && cursorId ? { createdAt: new Date(cursorCreatedAt), id: cursorId } : null;
  const { posts, nextCursor } = await getFeed(req.session.userId!, scope, cursor, limit);
  res.json({ posts, nextCursor });
});
