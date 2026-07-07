import { apiFetch } from "./client.js";
import type { Post, PostVisibility } from "./types.js";

export function listUserPosts(username: string) {
  return apiFetch<{ posts: Post[] }>(`/users/${encodeURIComponent(username)}/posts`);
}

export function createPost(input: { content: string; visibility: PostVisibility }) {
  return apiFetch<{ post: Post }>("/posts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updatePost(id: string, input: { content?: string; visibility?: PostVisibility }) {
  return apiFetch<{ post: Post }>(`/posts/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deletePost(id: string) {
  return apiFetch<void>(`/posts/${id}`, { method: "DELETE" });
}
