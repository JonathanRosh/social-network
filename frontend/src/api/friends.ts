import { apiFetch } from "./client.js";
import type { BasicProfile, Friendship, IncomingFriendRequest, OutgoingFriendRequest } from "./types.js";

export function sendFriendRequest(addresseeId: string) {
  return apiFetch<{ friendship: Friendship }>("/friends/requests", {
    method: "POST",
    body: JSON.stringify({ addresseeId }),
  });
}

export function listFriendRequests() {
  return apiFetch<{ incoming: IncomingFriendRequest[]; outgoing: OutgoingFriendRequest[] }>("/friends/requests");
}

export function acceptFriendRequest(requestId: string) {
  return apiFetch<{ friendship: Friendship }>(`/friends/requests/${requestId}/accept`, { method: "POST" });
}

export function declineFriendRequest(requestId: string) {
  return apiFetch<{ friendship: Friendship }>(`/friends/requests/${requestId}/decline`, { method: "POST" });
}

export function cancelFriendRequest(requestId: string) {
  return apiFetch<{ friendship: Friendship }>(`/friends/requests/${requestId}`, { method: "DELETE" });
}

export function listFriends() {
  return apiFetch<{ friends: BasicProfile[] }>("/friends");
}

export function removeFriend(userId: string) {
  return apiFetch<void>(`/friends/${userId}`, { method: "DELETE" });
}
