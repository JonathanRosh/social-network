import { apiFetch } from "./client.js";
import type { FeedCursor, FeedPage, FeedScope } from "./types.js";

export function getFeed(scope: FeedScope, cursor?: FeedCursor, limit = 20) {
  const params = new URLSearchParams({ scope, limit: String(limit) });
  if (cursor) {
    params.set("cursorCreatedAt", cursor.createdAt);
    params.set("cursorId", cursor.id);
  }
  return apiFetch<FeedPage>(`/feed?${params.toString()}`);
}
