import { useEffect, useState, type FormEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import * as commentsApi from "../api/comments.js";
import type { Comment } from "../api/types.js";
import { useSocket } from "../context/SocketContext.js";
import { useAuth } from "../context/AuthContext.js";
import { upsertComment, removeComment } from "../utils/commentsCache.js";
import { CommentItem } from "./CommentItem.js";

export function CommentSection({ postId }: { postId: string }) {
  const socket = useSocket();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const commentsQuery = useQuery({
    queryKey: ["comments", postId],
    queryFn: () => commentsApi.listComments(postId),
  });

  // Join the post's comment room only while this section is mounted (i.e.
  // expanded) — joining a room for every post in the feed at once would be
  // wasteful. The server re-checks visibility on every join (see
  // backend/src/socket/index.ts), so this can't be used to peek at a post
  // this viewer isn't otherwise allowed to see.
  useEffect(() => {
    if (!socket) return;

    socket.emit("post:join", postId);

    function onCreated(comment: Comment) {
      if (comment.postId === postId) upsertComment(queryClient, postId, comment);
    }
    function onUpdated(comment: Comment) {
      if (comment.postId === postId) upsertComment(queryClient, postId, comment);
    }
    function onDeleted({ id, postId: eventPostId }: { id: string; postId: string }) {
      if (eventPostId === postId) removeComment(queryClient, postId, id);
    }

    socket.on("comment:created", onCreated);
    socket.on("comment:updated", onUpdated);
    socket.on("comment:deleted", onDeleted);

    return () => {
      socket.emit("post:leave", postId);
      socket.off("comment:created", onCreated);
      socket.off("comment:updated", onUpdated);
      socket.off("comment:deleted", onDeleted);
    };
  }, [socket, postId, queryClient]);

  const createMutation = useMutation({
    mutationFn: () => commentsApi.createComment(postId, newComment),
    onSuccess: ({ comment }) => {
      upsertComment(queryClient, postId, comment);
      setNewComment("");
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newComment.trim()) createMutation.mutate();
  }

  if (!user) return null;

  return (
    <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
      {commentsQuery.data?.comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} isOwn={comment.authorId === user.id} />
      ))}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment…"
          maxLength={2000}
          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={createMutation.isPending || !newComment.trim()}
          className="rounded-md bg-gray-900 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
