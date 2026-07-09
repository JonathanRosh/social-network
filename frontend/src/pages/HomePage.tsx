import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getFeed } from "../api/feed.js";
import type { FeedCursor, FeedPost, FeedScope } from "../api/types.js";
import { useAuth } from "../context/AuthContext.js";
import { useSocket } from "../context/SocketContext.js";
import { prependFeedPost } from "../utils/feedCache.js";
import { PostComposer } from "../components/PostComposer.js";
import { PostCard } from "../components/PostCard.js";

const TABS: { scope: FeedScope; label: string }[] = [
  { scope: "friends", label: "Friends" },
  { scope: "discover", label: "Discover" },
];

export function HomePage() {
  const { user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [activeScope, setActiveScope] = useState<FeedScope>("friends");

  const query = useInfiniteQuery({
    queryKey: ["feed", activeScope],
    queryFn: ({ pageParam }: { pageParam?: FeedCursor }) => getFeed(activeScope, pageParam),
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

  // Live updates for both feeds at once (regardless of which tab is active),
  // so switching tabs never shows stale data. The server sends two distinct
  // events for the two distinct audiences (see backend/src/modules/posts/controller.ts),
  // so there's no ambiguity about which cache a given event belongs to.
  useEffect(() => {
    if (!socket) return;

    function onFriendsPost(post: FeedPost) {
      prependFeedPost(queryClient, ["feed", "friends"], post);
    }
    function onDiscoverPost(post: FeedPost) {
      prependFeedPost(queryClient, ["feed", "discover"], post);
    }

    socket.on("post:created", onFriendsPost);
    socket.on("post:created:public", onDiscoverPost);
    return () => {
      socket.off("post:created", onFriendsPost);
      socket.off("post:created:public", onDiscoverPost);
    };
  }, [socket, queryClient]);

  if (!user) return null;

  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <PostComposer username={user.username} />

      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.scope}
            type="button"
            onClick={() => setActiveScope(tab.scope)}
            className={`px-3 py-2 text-sm font-medium ${
              activeScope === tab.scope
                ? "border-b-2 border-gray-900 text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {query.isLoading && <p className="text-center text-sm text-gray-500">Loading feed…</p>}

      {posts.length === 0 && !query.isLoading && (
        <p className="text-center text-sm text-gray-500">
          {activeScope === "friends"
            ? "No posts yet. Add some friends or create your first post above."
            : "No public posts from anyone yet."}
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
