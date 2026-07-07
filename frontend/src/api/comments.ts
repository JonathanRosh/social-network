import { apiFetch } from "./client.js";
import type { Comment, CommentsPage } from "./types.js";

export function listComments(postId: string) {
  return apiFetch<CommentsPage>(`/posts/${postId}/comments?limit=100`);
}

export function createComment(postId: string, content: string) {
  return apiFetch<{ comment: Comment }>(`/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

export function updateComment(id: string, content: string) {
  return apiFetch<{ comment: Comment }>(`/comments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ content }),
  });
}

export function deleteComment(id: string) {
  return apiFetch<void>(`/comments/${id}`, { method: "DELETE" });
}
