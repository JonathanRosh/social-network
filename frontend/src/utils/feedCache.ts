import type { QueryClient } from "@tanstack/react-query";
import type { FeedPage, FeedPost } from "../api/types.js";

interface InfiniteFeedData {
  pages: FeedPage[];
  pageParams: unknown[];
}

/**
 * Prepend a realtime post:created payload into the feed's first cached page.
 * Dedupes against every already-loaded page (not just the first) so a post
 * that somehow arrives twice — e.g. a reconnect replay — never shows twice.
 */
export function prependFeedPost(queryClient: QueryClient, post: FeedPost) {
  queryClient.setQueryData<InfiniteFeedData>(["feed"], (old) => {
    if (!old || old.pages.length === 0) return old;
    const alreadyPresent = old.pages.some((page) => page.posts.some((existing) => existing.id === post.id));
    if (alreadyPresent) return old;

    const [firstPage, ...rest] = old.pages;
    const updatedFirstPage: FeedPage = { ...firstPage, posts: [post, ...firstPage.posts] };
    return { ...old, pages: [updatedFirstPage, ...rest] };
  });
}
