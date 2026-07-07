import { apiFetch } from "./client.js";
import type { PublicProfile, SessionUser } from "./types.js";

export function getProfile(username: string) {
  return apiFetch<{ user: PublicProfile }>(`/users/${encodeURIComponent(username)}`);
}

export function updateProfile(input: { displayName?: string; bio?: string | null; avatarUrl?: string | null }) {
  return apiFetch<{ user: SessionUser }>("/users/me", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
