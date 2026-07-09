import type { QueryClient } from "@tanstack/react-query";
import type { Comment, CommentsPage } from "../api/types.js";

/**
 * Dedupe-by-id then re-sort merge: the reconciliation strategy for realtime
 * updates. Never trust socket arrival order; always make ordering a pure
 * function of the data. Used both by the socket event handlers and directly
 * after a REST mutation succeeds, so the corresponding socket event, when it
 * arrives, is just a no-op dedupe hit against the same id.
 */
export function upsertComment(queryClient: QueryClient, postId: string, comment: Comment) {
  queryClient.setQueryData<CommentsPage>(["comments", postId], (old) => {
    if (!old) return old;
    const byId = new Map(old.comments.map((c) => [c.id, c]));
    byId.set(comment.id, comment);
    const comments = Array.from(byId.values()).sort(
      (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
    return { ...old, comments };
  });
}

export function removeComment(queryClient: QueryClient, postId: string, commentId: string) {
  queryClient.setQueryData<CommentsPage>(["comments", postId], (old) =>
    old ? { ...old, comments: old.comments.filter((c) => c.id !== commentId) } : old,
  );
}
