import { apiFetch } from "./client.js";
import type { Conversation, Message, MessagesPage } from "./types.js";

export function startConversation(friendId: string) {
  return apiFetch<{ conversation: Conversation }>("/messages/conversations", {
    method: "POST",
    body: JSON.stringify({ friendId }),
  });
}

export function listConversations() {
  return apiFetch<{ conversations: Conversation[] }>("/messages/conversations");
}

export function listMessages(conversationId: string) {
  return apiFetch<MessagesPage>(`/messages/conversations/${conversationId}/messages?limit=100`);
}

export function sendMessage(conversationId: string, content: string) {
  return apiFetch<{ message: Message }>(`/messages/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
