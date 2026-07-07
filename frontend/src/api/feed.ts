import { apiFetch } from "./client.js";
import type { FeedCursor, FeedPage } from "./types.js";

export function getFeed(cursor?: FeedCursor, limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) {
    params.set("cursorCreatedAt", cursor.createdAt);
    params.set("cursorId", cursor.id);
  }
  return apiFetch<FeedPage>(`/feed?${params.toString()}`);
}
