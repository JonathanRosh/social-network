import { apiFetch } from "./client.js";
import type { SessionUser } from "./types.js";

export function getMe() {
  return apiFetch<{ user: SessionUser }>("/auth/me");
}

export function register(input: { username: string; email: string; password: string; displayName: string }) {
  return apiFetch<{ user: SessionUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return apiFetch<{ user: SessionUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiFetch<void>("/auth/logout", { method: "POST" });
}
