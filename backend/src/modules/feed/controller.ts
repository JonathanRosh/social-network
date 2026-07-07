import { asyncHandler } from "../../utils/asyncHandler.js";
import { getFeed } from "./service.js";

export const getFeedHandler = asyncHandler(async (req, res) => {
  const { cursorCreatedAt, cursorId, limit } = req.query as unknown as {
    cursorCreatedAt?: string;
    cursorId?: string;
    limit: number;
  };

  const cursor = cursorCreatedAt && cursorId ? { createdAt: new Date(cursorCreatedAt), id: cursorId } : null;
  const { posts, nextCursor } = await getFeed(req.session.userId!, cursor, limit);
  res.json({ posts, nextCursor });
});
