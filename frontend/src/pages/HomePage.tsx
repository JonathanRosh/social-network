import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getFeed } from "../api/feed.js";
import type { FeedCursor } from "../api/types.js";
import { useAuth } from "../context/AuthContext.js";
import { PostComposer } from "../components/PostComposer.js";
import { PostCard } from "../components/PostCard.js";

export function HomePage() {
  const { user } = useAuth();

  const query = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam }: { pageParam?: FeedCursor }) => getFeed(pageParam),
    initialPageParam: undefined as FeedCursor | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  if (!user) return null;

  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <PostComposer username={user.username} />

      {posts.length === 0 && !query.isLoading && (
        <p className="text-center text-sm text-gray-500">
          No posts yet. Add some friends or create your first post above.
        </p>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isOwn={post.authorId === user.id}
          authorUsername={post.author.username}
          authorDisplayName={post.author.displayName}
        />
      ))}

      <div ref={sentinelRef} />
      {query.isFetchingNextPage && <p className="text-center text-sm text-gray-500">Loading more…</p>}
    </div>
  );
}
